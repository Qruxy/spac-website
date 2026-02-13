'use client';

/**
 * Client-side content wrapper for About page
 *
 * This component handles all client-side animated components (GradientText, StarBorder, ChromaGrid)
 * to avoid SSR bailout errors when using them in a Server Component context.
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Mail } from 'lucide-react';
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
}

interface AboutClientContentProps {
  boardMembers: BoardMember[];
}

export function AboutHeroWithAurora({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative container mx-auto px-4 mb-16 overflow-hidden">
      {/* Aurora background */}
      <div className="absolute inset-0 -z-10 opacity-40">
        <Aurora
          colorStops={['#6B21A8', '#0891B2', '#4F46E5']}
          amplitude={1.2}
          blend={0.6}
          speed={0.5}
        />
      </div>
      {children}
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
    color: getBoardColor(member.title),
    content: (
      <div>
        <h3 className="text-lg font-semibold text-white">{member.name}</h3>
        <p className="mt-0.5 text-sm font-medium" style={{ color: getBoardColor(member.title) }}>
          {member.title}
        </p>
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-3 w-3" />
            Contact
          </a>
        )}
      </div>
    ),
  }));

  return <ChromaGrid items={items} columns={3} />;
}

export function AboutCtaButton() {
  return (
    <StarBorder as={Link} href="/register" color="#ef4444" speed="4s">
      <span className="flex items-center gap-2 font-semibold">Join SPAC</span>
    </StarBorder>
  );
}
