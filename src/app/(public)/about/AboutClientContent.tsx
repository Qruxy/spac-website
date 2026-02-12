'use client';

/**
 * Client-side content wrapper for About page
 *
 * This component handles all client-side animated components (GradientText, StarBorder, BoardMemberGrid)
 * to avoid SSR bailout errors when using them in a Server Component context.
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GradientText } from '@/components/animated/gradient-text';
import { StarBorder } from '@/components/animated/star-border';
import { BoardMemberGrid } from '@/components/BoardMemberCard';

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

export function AboutBoardSection({ boardMembers }: AboutClientContentProps) {
  return <BoardMemberGrid members={boardMembers} />;
}

export function AboutCtaButton() {
  return (
    <StarBorder as={Link} href="/register" color="#818cf8" speed="4s">
      <span className="flex items-center gap-2 font-semibold">Join SPAC</span>
    </StarBorder>
  );
}
