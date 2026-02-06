import { PrismaClient } from '@prisma/client';
import { prismaMock } from './prisma-mock';

const isStaticExport = process.env.GITHUB_PAGES === 'true';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = isStaticExport
  ? (prismaMock as unknown as PrismaClient)
  : (globalForPrisma.prisma ??
    new PrismaClient({
      log: ['error'],
      // Pass URL explicitly so Prisma's engine uses the JS-inlined value
      // (Amplify inlines env vars via next.config.js but Prisma's Rust binary
      // reads OS env directly, not Node.js process.env)
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }));

if (!isStaticExport && process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma as PrismaClient;

export default prisma;
