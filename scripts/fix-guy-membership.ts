import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  // Create a new family record for Guy (primary) — Kelly can be linked later once confirmed
  const family = await p.family.create({
    data: { name: 'Earle Family' },
  });
  console.log('Family created:', family.id, family.name);

  const u = await p.user.update({
    where: { email: 'mileslegionis@verizon.net' },
    data: {
      familyId: family.id,
      isPrimaryMember: true,
      family_role: 'PRIMARY',
    },
  });
  console.log('User updated — familyId:', u.familyId, 'role:', u.family_role);

  const m = await p.membership.update({
    where: { userId: '21363130-7f03-4ad6-ad90-b0620d0ea8a1' },
    data: {
      type: 'FAMILY',
      status: 'ACTIVE',
      startDate: new Date('1993-01-01'),
      endDate: new Date('2027-01-01'),
    },
  });
  console.log('Membership updated — type:', m.type, 'status:', m.status, 'end:', m.endDate);
}

main().catch(console.error).finally(() => p.$disconnect());
