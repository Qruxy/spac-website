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
    }));

if (!isStaticExport && process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma as PrismaClient;

export default prisma;
