/**
 * Fix Board Member Duplicates
 *
 * The legacy clubOfficers table had multiple rows per person with different coID.
 * The migration created one BoardMember per row. This script deduplicates by
 * keeping the entry with the lowest sortOrder for each name+title combo.
 */

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    const allMembers = await prisma.boardMember.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    console.log(`Total board members: ${allMembers.length}`);

    // Group by name + title (case-insensitive)
    const groups = new Map<string, typeof allMembers>();
    for (const member of allMembers) {
      const key = `${member.name.toLowerCase()}|${member.title.toLowerCase()}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(member);
    }

    let duplicatesRemoved = 0;

    for (const [key, members] of groups) {
      if (members.length <= 1) continue;

      // Keep first (lowest sortOrder), delete the rest
      const [keep, ...remove] = members;
      console.log(`  Duplicate "${key}": keeping id=${keep.id} (sort=${keep.sortOrder}), removing ${remove.length} duplicates`);

      for (const dup of remove) {
        // Remove migration mapping
        await prisma.migrationIdMapping.deleteMany({
          where: {
            entity_type: 'board_member',
            newId: dup.id,
          },
        });

        // Delete the duplicate board member
        await prisma.boardMember.delete({
          where: { id: dup.id },
        });

        duplicatesRemoved++;
      }
    }

    const remaining = await prisma.boardMember.count();
    console.log(`\nDone: removed ${duplicatesRemoved} duplicates, ${remaining} board members remaining`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
