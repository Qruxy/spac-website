/**
 * NextAuth.js Configuration with AWS Cognito
 *
 * Authentication flow:
 * - Admins/moderators: Cognito (OAuth) — managed via AWS Cognito user pool
 * - Imported members: CredentialsProvider — bcrypt password hash from migration
 *
 * Cognito user groups map to application roles: admins, moderators, members
 */

import type { NextAuthOptions } from 'next-auth';
import CognitoProvider from 'next-auth/providers/cognito';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { rateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';

// Extend session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
      qrUuid: string;
      membershipType: string | null;
      membershipStatus: string | null;
      stripeCustomerId: string | null;
    };
  }

  interface User {
    id: string;
    role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
    qrUuid: string;
    membershipType: string | null;
    membershipStatus: string | null;
    stripeCustomerId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
    qrUuid: string;
    membershipType: string | null;
    membershipStatus: string | null;
    stripeCustomerId: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // AWS Cognito — admins and moderators authenticate here
    // Role is derived from Cognito group membership: admins → ADMIN, moderators → MODERATOR
    ...(process.env.AUTH_COGNITO_ID && process.env.AUTH_COGNITO_SECRET && process.env.AUTH_COGNITO_ISSUER
      ? [
          CognitoProvider({
            clientId: process.env.AUTH_COGNITO_ID,
            clientSecret: process.env.AUTH_COGNITO_SECRET,
            issuer: process.env.AUTH_COGNITO_ISSUER,
            profile(profile) {
              const groups: string[] = profile['cognito:groups'] || [];
              let role: 'MEMBER' | 'MODERATOR' | 'ADMIN' = 'MEMBER';
              if (groups.includes('admins')) {
                role = 'ADMIN';
              } else if (groups.includes('moderators')) {
                role = 'MODERATOR';
              }

              return {
                id: profile.sub,
                email: profile.email,
                name: `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || profile.email,
                role,
                qrUuid: '',
                membershipType: null,
                membershipStatus: null,
                stripeCustomerId: null,
              };
            },
          }),
        ]
      : []),

    // Credentials provider — for imported members with bcrypt password hashes
    // Dev-only fallback: email-only login when no passwordHash exists
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limiting by email
        const rateLimitKey = getRateLimitKey('login', credentials.email.toLowerCase());
        if (!rateLimit(rateLimitKey, RATE_LIMITS.LOGIN.limit, RATE_LIMITS.LOGIN.windowMs)) {
          console.warn(`[auth] Rate limit exceeded for: ${credentials.email}`);
          throw new Error('Too many login attempts. Please try again later.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { membership: true },
        });

        if (!user) return null;

        // Bcrypt login — imported members with hashed passwords
        if (user.passwordHash) {
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            qrUuid: user.qrUuid,
            membershipType: user.membership?.type ?? null,
            membershipStatus: user.membership?.status ?? null,
            stripeCustomerId: user.stripeCustomerId,
          };
        }

        // Development only: email-only login for local testing (no password check)
        if (process.env.NODE_ENV === 'development') {
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            qrUuid: user.qrUuid,
            membershipType: user.membership?.type ?? null,
            membershipStatus: user.membership?.status ?? null,
            stripeCustomerId: user.stripeCustomerId,
          };
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'cognito') {
        // Sync Cognito user into local DB on first sign-in
        const existingUser = await prisma.user.findFirst({
          where: { cognitoId: user.id },
        });

        if (!existingUser) {
          const emailUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (emailUser) {
            // Link existing DB user to Cognito
            await prisma.user.update({
              where: { id: emailUser.id },
              data: { cognitoId: user.id },
            });
          } else {
            // Create new DB record for Cognito user
            const nameParts = (user.name || '').split(' ');
            await prisma.user.create({
              data: {
                cognitoId: user.id,
                email: user.email!,
                firstName: nameParts[0] || 'New',
                lastName: nameParts.slice(1).join(' ') || 'Member',
                role: (user as { role?: 'MEMBER' | 'MODERATOR' | 'ADMIN' }).role ?? 'MEMBER',
              },
            });
          }
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { membership: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.qrUuid = dbUser.qrUuid;
          token.membershipType = dbUser.membership?.type ?? null;
          token.membershipStatus = dbUser.membership?.status ?? null;
          token.stripeCustomerId = dbUser.stripeCustomerId;
        }
      }

      if (trigger === 'update' && session) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { membership: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.membershipType = dbUser.membership?.type ?? null;
          token.membershipStatus = dbUser.membership?.status ?? null;
          token.stripeCustomerId = dbUser.stripeCustomerId;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.qrUuid = token.qrUuid;
      session.user.membershipType = token.membershipType;
      session.user.membershipStatus = token.membershipStatus;
      session.user.stripeCustomerId = token.stripeCustomerId;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
    newUser: '/welcome',
  },

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  debug: process.env.NODE_ENV === 'development',
};
