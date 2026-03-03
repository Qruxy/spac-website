'use client';

/**
 * Client-side content wrapper for About page
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Mail, User } from 'lucide-react';
import { GradientText } from '@/components/animated/gradient-text';
import { StarBorder } from '@/components/animated/star-border';

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
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {boardMembers.map((member, index) => {
        const color = getBoardColor(member.title);
        return (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-white/20 transition-all duration-200"
          >
            {/* Accent bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />

            <div className="p-4 flex flex-col gap-3">
              {/* Avatar */}
              <div className="flex items-center gap-3">
                <div
                  className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: `${color}20`, border: `1.5px solid ${color}50` }}
                >
                  {member.imageUrl ? (
                    <Image
                      src={member.imageUrl}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <User className="w-4 h-4" style={{ color }} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">{member.name}</p>
                  <span
                    className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {member.title}
                  </span>
                </div>
              </div>

              {/* Bio */}
              {member.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {member.bio}
                </p>
              )}

              {/* Email */}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{member.email}</span>
                </a>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function AboutCtaButton() {
  return (
    <StarBorder as={Link} href="/register" color="#ef4444" speed="4s">
      <span className="flex items-center gap-2 font-semibold">Join SPAC</span>
    </StarBorder>
  );
}
