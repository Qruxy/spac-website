/**
 * About Page
 *
 * Information about SPAC history, mission, and board members.
 * Enhanced with React Bits animated components.
 */

import type { Metadata } from 'next';
import { Users, History, Target, Award } from 'lucide-react';
import { prisma } from '@/lib/db';
import {
  AboutHeroTitle,
  AboutHeroWithAurora,
  AboutBoardSection,
  AboutCtaButton,
} from './AboutClientContent';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about the St. Petersburg Astronomy Club, Tampa Bay\'s oldest astronomy organization founded in 1927.',
};

// ISR with 1-hour revalidation - board members rarely change
export const revalidate = 3600;

// Fallback board members if database is empty
const fallbackBoardMembers = [
  { name: 'John Smith', title: 'Club President', email: 'president@stpeteastronomyclub.org', imageUrl: 'https://picsum.photos/seed/president/400/400' },
  { name: 'Sarah Johnson', title: 'Vice President', email: 'vp@stpeteastronomyclub.org', imageUrl: 'https://picsum.photos/seed/vicepresident/400/400' },
  { name: 'Mike Williams', title: 'Secretary', email: 'secretary@stpeteastronomyclub.org', imageUrl: 'https://picsum.photos/seed/secretary/400/400' },
  { name: 'Emily Davis', title: 'Treasurer', email: 'treasurer@stpeteastronomyclub.org', imageUrl: 'https://picsum.photos/seed/treasurer/400/400' },
  { name: 'Peter McLean', title: 'Membership Chair', email: 'membership@stpeteastronomyclub.org', imageUrl: 'https://picsum.photos/seed/membership/400/400' },
  { name: 'Guy Earle', title: 'Newsletter Editor', email: 'newsletter@stpeteastronomyclub.org', imageUrl: 'https://picsum.photos/seed/newsletter/400/400' },
];

async function getBoardMembers() {
  try {
    const members = await prisma.boardMember.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        name: true,
        title: true,
        email: true,
        imageUrl: true,
      },
    });
    return members.length > 0 ? members : fallbackBoardMembers;
  } catch {
    return fallbackBoardMembers;
  }
}

const milestones = [
  { year: '1927', event: 'Club founded in St. Petersburg, Florida' },
  { year: '1950s', event: 'Began regular public observing sessions' },
  { year: '1970s', event: 'Established Mirror Lab for telescope making' },
  { year: '1980s', event: 'First Orange Blossom Special star party held' },
  { year: '2000s', event: 'Expanded outreach to schools and community' },
  { year: 'Today', event: 'Over 300 active members and growing' },
];

export default async function AboutPage() {
  const boardMembers = await getBoardMembers();
  return (
    <div className="py-12">
      {/* Hero with Aurora Background */}
      <AboutHeroWithAurora>
        <div className="py-8">
          <AboutHeroTitle />
          <p className="text-xl text-muted-foreground max-w-3xl">
            For nearly a century, SPAC has been bringing the wonders of the night
            sky to Tampa Bay. We&apos;re a community of amateur astronomers,
            educators, and stargazers united by our passion for exploring the cosmos.
          </p>
        </div>
      </AboutHeroWithAurora>

      {/* Mission */}
      <section id="mission" className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-primary mb-4">
                <Target className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wider">
                  Our Mission
                </span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Making Astronomy Accessible to All
              </h2>
              <p className="text-muted-foreground mb-4">
                The St. Petersburg Astronomy Club is dedicated to promoting astronomy
                education, providing observing opportunities, and fostering a
                community of amateur astronomers in the Tampa Bay area.
              </p>
              <p className="text-muted-foreground">
                Whether you&apos;re looking through a telescope for the first time
                or you&apos;re an experienced deep-sky observer, SPAC welcomes you
                to join our community of stargazers.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <div className="text-3xl font-bold text-primary">97+</div>
                <div className="text-sm text-muted-foreground">Years Active</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <div className="text-3xl font-bold text-primary">300+</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <div className="text-3xl font-bold text-primary">12+</div>
                <div className="text-sm text-muted-foreground">Annual Events</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <div className="text-3xl font-bold text-primary">1000s</div>
                <div className="text-sm text-muted-foreground">Students Reached</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section id="history" className="py-16">
        <div className="container mx-auto px-4">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <History className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Our History
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-8">
            A Legacy of Stargazing
          </h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border md:left-1/2 md:-translate-x-1/2" />

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`relative flex items-start gap-4 md:gap-8 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 w-2 h-2 rounded-full bg-primary md:left-1/2 md:-translate-x-1/2" />

                  {/* Content */}
                  <div
                    className={`ml-12 md:ml-0 md:w-1/2 ${
                      index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'
                    }`}
                  >
                    <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-2">
                      {milestone.year}
                    </div>
                    <p className="text-foreground">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Board Members */}
      <section id="board" className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Leadership
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Board of Directors
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Meet our dedicated volunteer leadership team.
          </p>

          <AboutBoardSection boardMembers={boardMembers} />
        </div>
      </section>

      {/* Affiliations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Award className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Affiliations
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Our Partners & Affiliations
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Astronomical Society of the Pacific
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                The world&apos;s largest general astronomy society, connecting
                scientists, educators, and enthusiasts.
              </p>
              <a
                href="https://www.astrosociety.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Learn more
              </a>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-2">
                International Dark-Sky Association
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Working to protect the night sky from light pollution for present
                and future generations.
              </p>
              <a
                href="https://www.darksky.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to Join Us?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Become a member today and start exploring the universe with fellow
            astronomy enthusiasts.
          </p>
          <AboutCtaButton />
        </div>
      </section>
    </div>
  );
}
