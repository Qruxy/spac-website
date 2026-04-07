'use client';

/**
 * Client-side content wrapper for About page
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GradientText } from '@/components/animated/gradient-text';
import { StarBorder } from '@/components/animated/star-border';
import { ChromaGrid } from '@/components/animated/chroma-grid';
import type { ChromaGridItem } from '@/components/animated/chroma-grid';

// Dynamic import for WebGL Aurora component to avoid SSR issues
const Aurora = dynamic(() => import('@/components/animated/aurora'), {
  ssr: false,
  loading: () => null,
});

interface BoardMember {
  name: string;
  title: string;
  email: string | null;
  imageUrl: string | null;
  bio: string | null;
}

interface AboutClientContentProps {
  boardMembers: BoardMember[];
}

export function AboutHeroWithAurora({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative w-full pt-20 pb-32">
      {/* Aurora fills full width — no overflow-hidden, bleeds edge to edge */}
      <div className="absolute inset-0 -z-10 opacity-35">
        <Aurora
          colorStops={['#6B21A8', '#0891B2', '#4F46E5']}
          amplitude={1.2}
          blend={0.6}
          speed={0.5}
        />
      </div>
      {/* Fade top edge into page bg */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent -z-10" />
      {/* Fade bottom edge into page bg */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent -z-10" />
      <div className="container mx-auto px-4">
        {children}
      </div>
    </section>
  );
}

export function AboutHeroTitle() {
  return (
    <h1 className="text-4xl font-bold text-foreground mb-4">
      About{' '}
      <GradientText
        colors={['#818cf8', '#c084fc', '#f472b6', '#818cf8']}
        className="text-4xl font-bold"
        animationSpeed={6}
      >
        St. Petersburg Astronomy Club
      </GradientText>
    </h1>
  );
}

// Board-position color palette
const boardColors: Record<string, string> = {
  president: '#3b82f6',
  'vice president': '#8b5cf6',
  secretary: '#ec4899',
  treasurer: '#f97316',
  membership: '#06b6d4',
  newsletter: '#10b981',
  outreach: '#f43f5e',
  webmaster: '#6366f1',
};

function getBoardColor(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, color] of Object.entries(boardColors)) {
    if (lower.includes(key)) return color;
  }
  return '#818cf8';
}

export function AboutBoardSection({ boardMembers }: AboutClientContentProps) {
  const items: ChromaGridItem[] = boardMembers.map((member, index) => ({
    id: `board-${index}`,
    image: member.imageUrl || undefined,
    title: member.name,
    subtitle: member.title,
    bio: member.bio,
    email: member.email,
    color: getBoardColor(member.title),
  }));

  return <ChromaGrid items={items} columns={4} compact />;
}

export function AboutCtaButton() {
  return (
    <StarBorder as={Link} href="/register" color="#ef4444" speed="4s">
      <span className="flex items-center gap-2 font-semibold">Join SPAC</span>
    </StarBorder>
  );
}
