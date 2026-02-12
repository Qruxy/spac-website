'use client';

/**
 * Hero Section Component
 *
 * Animated hero section with Galaxy background and spinning logo badge.
 * Enhanced with React Bits BlurText and ShinyText animations.
 * Respects prefers-reduced-motion for accessibility.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
// Direct imports to avoid barrel export bundle bloat
import { CircularText } from '@/components/animated/circular-text';
import { BlurText } from '@/components/animated/blur-text';
import { ShinyText } from '@/components/animated/shiny-text';
import '@/components/animated/circular-text.css';
import spacLogo from '../../../public/images/spac-logo-hires.png';

// Dynamic import Galaxy to avoid SSR issues with WebGL
const Galaxy = dynamic(
  () => import('@/components/animated/galaxy').then((mod) => mod.Galaxy),
  { ssr: false }
);

export function HeroSection() {
  // Check for prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <section className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden bg-slate-950">
      {/* Galaxy Background */}
      <div className="absolute inset-0">
        <Galaxy
          mouseRepulsion={!prefersReducedMotion}
          mouseInteraction={!prefersReducedMotion}
          disableAnimation={prefersReducedMotion}
          density={1.5}
          glowIntensity={0.5}
          saturation={0.8}
          hueShift={210}
          transparent={false}
        />
      </div>

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/30 to-slate-950/70" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        {/* Logo with Spinning Text */}
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <div
            className="relative inline-flex items-center justify-center"
            style={{
              width: 440,
              height: 440,
              // @ts-expect-error CSS custom properties
              '--radius': 220,
              '--font-size': '13px',
            }}
          >
            {/* Center Logo */}
            <motion.div
              className="relative z-10 rounded-full overflow-hidden"
              whileHover={{ scale: 1.05 }}
              style={{ width: 240, height: 240 }}
            >
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-primary/30 rounded-full blur-2xl" />

              {/* Logo */}
              <Image
                src={spacLogo}
                alt="St. Petersburg Astronomy Club"
                width={240}
                height={240}
                className="relative z-10 rounded-full object-contain"
                priority
              />
            </motion.div>

            {/* Spinning Text Ring - z-20 to appear above logo */}
            <div className="absolute inset-0 z-20" style={{ color: '#60a5fa' }}>
              <CircularText
                text="ST. PETERSBURG ASTRONOMY CLUB ★ SINCE 1927 ★ "
                spinDuration={20}
                onHover="speedUp"
                className="font-bold"
              />
            </div>
          </div>
        </motion.div>

        <div className="mb-4">
          <BlurText
            text="St. Petersburg"
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-blue-400 justify-center"
            delay={80}
            animateBy="characters"
            direction="top"
          />
          <BlurText
            text="Astronomy Club"
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl justify-center"
            delay={60}
            animateBy="characters"
            direction="bottom"
          />
        </div>

        <motion.div
          className="mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
        >
          <ShinyText
            text="Tampa Bay's Home for Family Astronomy"
            className="text-xl sm:text-2xl font-medium"
            color="#60a5fa"
            shineColor="#93c5fd"
            speed={3}
          />
        </motion.div>

        <motion.p
          className="mb-8 text-lg text-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
        >
          Exploring the cosmos since 1927
        </motion.p>

        <motion.div
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: 'easeOut' }}
        >
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-all hover:bg-blue-500 hover:scale-105 shadow-lg shadow-blue-600/30"
          >
            Join Today
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/events"
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-3 text-lg font-semibold text-white transition-all hover:bg-white/10 hover:scale-105"
          >
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{
          opacity: { delay: 1, duration: 0.5 },
          y: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
        }}
      >
        <svg
          className="h-8 w-8 text-white/50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </motion.div>
    </section>
  );
}
