/**
 * NextAuth.js Configuration with AWS Cognito
 *
 * Handles authentication for SPAC members with role-based access.
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
    // AWS Cognito Provider (only if configured)
    ...(process.env.AUTH_COGNITO_ID && process.env.AUTH_COGNITO_SECRET
      ? [
          CognitoProvider({
            clientId: process.env.AUTH_COGNITO_ID,
            clientSecret: process.env.AUTH_COGNITO_SECRET,
            issuer: process.env.AUTH_COGNITO_ISSUER,
            profile(profile) {
              const groups = profile['cognito:groups'] || [];
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

    // Credentials provider (demo account + dev-mode DB login)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email / Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limiting for login attempts (by email)
        const rateLimitKey = getRateLimitKey('login', credentials.email.toLowerCase());
        if (!rateLimit(rateLimitKey, RATE_LIMITS.LOGIN.limit, RATE_LIMITS.LOGIN.windowMs)) {
          console.warn(`Rate limit exceeded for login: ${credentials.email}`);
          throw new Error('Too many login attempts. Please try again later.');
        }

        // Demo user with specific credentials
        const DEMO_USER = {
          username: 'demo',
          password: 'Sp@C2025!',
          email: 'demo@spac.local',
          firstName: 'Demo',
          lastName: 'Admin',
          role: 'ADMIN' as const,
        };

        // Check if logging in as demo user
        if (credentials.email === DEMO_USER.username || credentials.email === DEMO_USER.email) {
          if (credentials.password !== DEMO_USER.password) {
            return null;
          }

          // Find or create demo user in DB
          let user = await prisma.user.findUnique({
            where: { email: DEMO_USER.email },
            include: { membership: true },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: DEMO_USER.email,
                firstName: DEMO_USER.firstName,
                lastName: DEMO_USER.lastName,
                role: DEMO_USER.role,
              },
              include: { membership: true },
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            qrUuid: user.qrUuid,
            membershipType: user.membership?.type || null,
            membershipStatus: user.membership?.status || null,
            stripeCustomerId: user.stripeCustomerId,
          };
        }

        // Password-based login for registered users
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { membership: true },
        });

        if (user?.passwordHash) {
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            qrUuid: user.qrUuid,
            membershipType: user.membership?.type || null,
            membershipStatus: user.membership?.status || null,
            stripeCustomerId: user.stripeCustomerId,
          };
        }

        // Development only: allow existing DB users to login by email
        // (no password check - only for local development)
        if (process.env.NODE_ENV === 'development' && user) {
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            qrUuid: user.qrUuid,
            membershipType: user.membership?.type || null,
            membershipStatus: user.membership?.status || null,
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
        // Sync Cognito user with local database
        const existingUser = await prisma.user.findFirst({
          where: { cognitoId: user.id },
        });

        if (!existingUser) {
          // Check if user exists by email
          const emailUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (emailUser) {
            // Link existing user to Cognito
            await prisma.user.update({
              where: { id: emailUser.id },
              data: { cognitoId: user.id },
            });
          } else {
            // Create new user
            const nameParts = (user.name || '').split(' ');
            await prisma.user.create({
              data: {
                cognitoId: user.id,
                email: user.email!,
                firstName: nameParts[0] || 'New',
                lastName: nameParts.slice(1).join(' ') || 'Member',
                role: user.role || 'MEMBER',
              },
            });
          }
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign in - get fresh data from DB
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { membership: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.qrUuid = dbUser.qrUuid;
          token.membershipType = dbUser.membership?.type || null;
          token.membershipStatus = dbUser.membership?.status || null;
          token.stripeCustomerId = dbUser.stripeCustomerId;
        }
      }

      // Handle session updates (e.g., after membership change)
      if (trigger === 'update' && session) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { membership: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.membershipType = dbUser.membership?.type || null;
          token.membershipStatus = dbUser.membership?.status || null;
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
