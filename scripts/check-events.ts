import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const evs = await p.event.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, title: true, status: true, startDate: true, type: true, createdAt: true },
  });
  console.log(JSON.stringify(evs, null, 2));
}
main().catch(console.error).finally(() => p.$disconnect());
