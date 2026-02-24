/**
 * NextAuth.js Configuration
 *
 * Single login form handles all users transparently:
 * 1. Imported members  → bcrypt password hash check (DB)
 * 2. Cognito users     → USER_PASSWORD_AUTH via AWS SDK, sub+role from JWT decode
 * 3. Dev fallback      → email-only login (NODE_ENV=development only)
 *
 * Note: AUTH_COGNITO_* vars must be in next.config.js `env` block — Amplify
 * inlines env vars at build time; they are NOT injected at Lambda runtime.
 */

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
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

function cognitoSecretHash(username: string): string {
  return crypto
    .createHmac('sha256', process.env.AUTH_COGNITO_SECRET!)
    .update(username + process.env.AUTH_COGNITO_ID!)
    .digest('base64');
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const segment = token.split('.')[1];
  const padded = segment + '='.repeat((4 - (segment.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

async function authenticateWithCognito(
  email: string,
  password: string
): Promise<{ role: 'MEMBER' | 'MODERATOR' | 'ADMIN'; cognitoId: string } | null> {
  const clientId = process.env.AUTH_COGNITO_ID;
  const clientSecret = process.env.AUTH_COGNITO_SECRET;
  const issuer = process.env.AUTH_COGNITO_ISSUER;

  if (!clientId || !clientSecret || !issuer) return null;

  const regionMatch = issuer.match(/cognito-idp\.([\w-]+)\.amazonaws\.com/);
  if (!regionMatch) return null;
  const region = regionMatch[1];

  const client = new CognitoIdentityProviderClient({ region });

  try {
    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: cognitoSecretHash(email),
        },
      })
    );

    if (result.ChallengeName) {
      console.error('[auth] Cognito challenge required:', result.ChallengeName);
      return null;
    }

    const idToken = result.AuthenticationResult?.IdToken;
    if (!idToken) return null;

    // Decode IdToken JWT — contains sub + cognito:groups; no extra API call needed
    const payload = decodeJwtPayload(idToken);
    const sub = payload['sub'] as string;
    const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];

    let role: 'MEMBER' | 'MODERATOR' | 'ADMIN' = 'MEMBER';
    if (groups.includes('admins')) role = 'ADMIN';
    else if (groups.includes('moderators')) role = 'MODERATOR';

    return { role, cognitoId: sub };
  } catch (err: unknown) {
    const code = (err as { name?: string }).name;
    if (code !== 'NotAuthorizedException' && code !== 'UserNotFoundException') {
      console.error('[auth] Cognito error:', code);
    }
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const emailLower = credentials.email.trim().toLowerCase();

        // Rate limiting by email
        const rateLimitKey = getRateLimitKey('login', emailLower);
        if (!rateLimit(rateLimitKey, RATE_LIMITS.LOGIN.limit, RATE_LIMITS.LOGIN.windowMs)) {
          console.warn(`[auth] Rate limit exceeded for: ${emailLower}`);
          throw new Error('Too many login attempts. Please try again later.');
        }

        // --- Path 1: bcrypt (imported members with passwordHash) ---
        const user = await prisma.user.findUnique({
          where: { email: emailLower },
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
            membershipType: user.membership?.type ?? null,
            membershipStatus: user.membership?.status ?? null,
            stripeCustomerId: user.stripeCustomerId,
          };
        }

        // --- Path 2: Cognito (admins, moderators, Cognito-only users) ---
        const cognitoResult = await authenticateWithCognito(
          credentials.email.trim(),
          credentials.password
        );

        if (cognitoResult) {
          const dbUser = await prisma.user.upsert({
            where: { email: emailLower },
            update: {
              cognitoId: cognitoResult.cognitoId,
              role: cognitoResult.role,
            },
            create: {
              email: emailLower,
              cognitoId: cognitoResult.cognitoId,
              firstName: emailLower.split('@')[0],
              lastName: '',
              role: cognitoResult.role,
            },
            include: { membership: true },
          });

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: `${dbUser.firstName} ${dbUser.lastName}`.trim() || dbUser.email,
            role: dbUser.role,
            qrUuid: dbUser.qrUuid,
            membershipType: dbUser.membership?.type ?? null,
            membershipStatus: dbUser.membership?.status ?? null,
            stripeCustomerId: dbUser.stripeCustomerId,
          };
        }

        // --- Path 3: dev-only email fallback ---
        if (process.env.NODE_ENV === 'development' && user) {
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
