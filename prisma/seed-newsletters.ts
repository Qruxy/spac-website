/**
 * Newsletter Seed Data
 *
 * Run with: npx ts-node prisma/seed-newsletters.ts
 * Or import into existing seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleNewsletters = [
  // 2024 Issues
  {
    title: 'January 2024',
    description: 'OBS 2024 Preview, Winter Observing Tips, and Quadrantid Meteor Shower Report',
    year: 2024,
    month: 1,
    filename: 'celestial-observer-2024-01.pdf',
    fileUrl: '/newsletters/2024/celestial-observer-2024-01.pdf',
  },
  {
    title: 'February 2024',
    description: 'Valentine\'s Night Star Party, Mars Opposition Preview, and Astrophotography Workshop Recap',
    year: 2024,
    month: 2,
    filename: 'celestial-observer-2024-02.pdf',
    fileUrl: '/newsletters/2024/celestial-observer-2024-02.pdf',
  },
  {
    title: 'March 2024',
    description: 'Spring Equinox Events, Galaxy Season Begins, and New Member Telescope Guide',
    year: 2024,
    month: 3,
    filename: 'celestial-observer-2024-03.pdf',
    fileUrl: '/newsletters/2024/celestial-observer-2024-03.pdf',
  },
  {
    title: 'April 2024',
    description: 'Total Solar Eclipse Special Edition! Travel Reports and Photos from the Path of Totality',
    year: 2024,
    month: 4,
    filename: 'celestial-observer-2024-04.pdf',
    fileUrl: '/newsletters/2024/celestial-observer-2024-04.pdf',
  },
  {
    title: 'May 2024',
    description: 'Eta Aquarid Meteor Shower, Planetary Parade, and Annual Meeting Recap',
    year: 2024,
    month: 5,
    filename: 'celestial-observer-2024-05.pdf',
    fileUrl: '/newsletters/2024/celestial-observer-2024-05.pdf',
  },
  {
    title: 'June 2024',
    description: 'Summer Star Party Planning, Saturn Ring Viewing Tips, and Messier Marathon Results',
    year: 2024,
    month: 6,
    filename: 'celestial-observer-2024-06.pdf',
    fileUrl: '/newsletters/2024/celestial-observer-2024-06.pdf',
  },
  // 2023 Issues
  {
    title: 'December 2023',
    description: 'Year in Review: Highlights from 2023, Geminid Meteor Shower Guide',
    year: 2023,
    month: 12,
    filename: 'celestial-observer-2023-12.pdf',
    fileUrl: '/newsletters/2023/celestial-observer-2023-12.pdf',
  },
  {
    title: 'November 2023',
    description: 'OBS 2023 Recap, Leonid Meteor Shower, and Holiday Observing Guide',
    year: 2023,
    month: 11,
    filename: 'celestial-observer-2023-11.pdf',
    fileUrl: '/newsletters/2023/celestial-observer-2023-11.pdf',
  },
  {
    title: 'October 2023',
    description: 'Annular Eclipse Coverage, Halloween Star Party, and Jupiter at Opposition',
    year: 2023,
    month: 10,
    filename: 'celestial-observer-2023-10.pdf',
    fileUrl: '/newsletters/2023/celestial-observer-2023-10.pdf',
  },
  {
    title: 'September 2023',
    description: 'Fall Astronomy Season, New Equipment Reviews, and Outreach Event Highlights',
    year: 2023,
    month: 9,
    filename: 'celestial-observer-2023-09.pdf',
    fileUrl: '/newsletters/2023/celestial-observer-2023-09.pdf',
  },
  {
    title: 'August 2023',
    description: 'Perseid Meteor Shower Special, Summer Star Party Photos, and Saturn Viewing',
    year: 2023,
    month: 8,
    filename: 'celestial-observer-2023-08.pdf',
    fileUrl: '/newsletters/2023/celestial-observer-2023-08.pdf',
  },
  {
    title: 'July 2023',
    description: 'Deep Sky Objects for Summer, Venus at Greatest Brilliance, and Member Spotlight',
    year: 2023,
    month: 7,
    filename: 'celestial-observer-2023-07.pdf',
    fileUrl: '/newsletters/2023/celestial-observer-2023-07.pdf',
  },
  // 2022 Issues (sampling)
  {
    title: 'December 2022',
    description: '2022 Astronomy Highlights, Winter Solstice Events, and Planning for 2023',
    year: 2022,
    month: 12,
    filename: 'celestial-observer-2022-12.pdf',
    fileUrl: '/newsletters/2022/celestial-observer-2022-12.pdf',
  },
  {
    title: 'June 2022',
    description: 'Planetary Alignment Special, Club Anniversary Celebration, and Summer Events',
    year: 2022,
    month: 6,
    filename: 'celestial-observer-2022-06.pdf',
    fileUrl: '/newsletters/2022/celestial-observer-2022-06.pdf',
  },
  {
    title: 'January 2022',
    description: 'New Year\'s Eve Star Party Recap, 2022 Astronomy Preview, and Equipment Guide',
    year: 2022,
    month: 1,
    filename: 'celestial-observer-2022-01.pdf',
    fileUrl: '/newsletters/2022/celestial-observer-2022-01.pdf',
  },
];

async function seedNewsletters() {
  console.log('🌟 Seeding newsletters...');

  // Get a user ID for uploadedById (use first admin or any user)
  const user = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (!user) {
    console.error('❌ No admin user found. Please create a user first.');
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const newsletter of sampleNewsletters) {
    // Check if already exists
    const existing = await prisma.clubDocument.findFirst({
      where: {
        category: 'NEWSLETTER',
        year: newsletter.year,
        month: newsletter.month,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.clubDocument.create({
      data: {
        title: newsletter.title,
        description: newsletter.description,
        category: 'NEWSLETTER',
        fileUrl: newsletter.fileUrl,
        filename: newsletter.filename,
        mimeType: 'application/pdf',
        size: Math.floor(Math.random() * 3000000) + 500000, // Random size 500KB-3.5MB
        year: newsletter.year,
        month: newsletter.month,
        isPublic: true,
        uploadedById: user.id,
      },
    });
    created++;
  }

  console.log(`✅ Created ${created} newsletters, skipped ${skipped} existing`);
}

// Run if executed directly
seedNewsletters()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedNewsletters, sampleNewsletters };
