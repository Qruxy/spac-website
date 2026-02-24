'use client';

/**
 * Hero Section Component
 *
 * Animated hero section with Galaxy background and spinning logo badge.
 * Enhanced with React Bits BlurText and ShinyText animations.
 * Respects prefers-reduced-motion for accessibility.
 *
 * PERF FIXES:
 * - Galaxy config determined once after mount (mobile + reduced-motion) — prevents
 *   Galaxy useEffect re-running (teardown + rebuild WebGL context) when state changes
 * - Mobile: Galaxy completely disabled (replaced with CSS gradient) — no WebGL on phones
 * - Desktop: density reduced 1.5→0.8, mouse interaction only on pointer devices
 * - Galaxy not rendered at all until config is ready (avoids double WebGL init)
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CircularText } from '@/components/animated/circular-text';
import { BlurText } from '@/components/animated/blur-text';
import { ShinyText } from '@/components/animated/shiny-text';
import { StarBorder } from '@/components/animated/star-border';
import '@/components/animated/circular-text.css';
import spacLogo from '../../../public/images/spac-logo-hires.png';

const Galaxy = dynamic(
  () => import('@/components/animated/galaxy').then((mod) => mod.Galaxy),
  { ssr: false }
);

interface GalaxyConfig {
  enabled: boolean;
  disableAnimation: boolean;
  mouseInteraction: boolean;
  mouseRepulsion: boolean;
  density: number;
  glowIntensity: number;
}

export function HomeCtaButton() {
  return (
    <StarBorder as={Link} href="/register" color="#ef4444" speed="4s">
      <span className="flex items-center gap-2 text-lg font-semibold">
        Become a Member
        <ArrowRight className="h-5 w-5" />
      </span>
    </StarBorder>
  );
}

export function HeroSection() {
  // Determine Galaxy config once after mount — a single stable config so the WebGL
  // context is never rebuilt due to state churn.
  const [galaxyConfig, setGalaxyConfig] = useState<GalaxyConfig | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);

    if (isMobile) {
      // No WebGL on mobile — too expensive; CSS gradient fallback handles the background
      setGalaxyConfig({ enabled: false, disableAnimation: true, mouseInteraction: false, mouseRepulsion: false, density: 0, glowIntensity: 0 });
    } else if (reducedMotion) {
      // Desktop but motion reduced: render a static starfield (single frame, rAF stopped)
      setGalaxyConfig({ enabled: true, disableAnimation: true, mouseInteraction: false, mouseRepulsion: false, density: 0.8, glowIntensity: 0.3 });
    } else {
      // Full desktop experience
      setGalaxyConfig({ enabled: true, disableAnimation: false, mouseInteraction: true, mouseRepulsion: true, density: 0.8, glowIntensity: 0.3 });
    }
  }, []); // Empty deps — runs once, never triggers Galaxy re-mount

  return (
    <section className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden bg-slate-950">
      {/* Background: WebGL Galaxy on desktop, CSS gradient on mobile */}
      <div className="absolute inset-0">
        {galaxyConfig?.enabled ? (
          <Galaxy
            mouseRepulsion={galaxyConfig.mouseRepulsion}
            mouseInteraction={galaxyConfig.mouseInteraction}
            disableAnimation={galaxyConfig.disableAnimation}
            density={galaxyConfig.density}
            glowIntensity={galaxyConfig.glowIntensity}
            saturation={0.8}
            hueShift={210}
            transparent={false}
          />
        ) : (
          // Mobile fallback: pure CSS, zero GPU cost
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/30 to-slate-950">
            {/* Layer 1: small white stars */}
            <div className="absolute inset-0" style={{
              backgroundImage: [
                'radial-gradient(circle 1px at 10% 15%, rgba(255,255,255,0.9), transparent)',
                'radial-gradient(circle 1px at 25% 45%, rgba(147,197,253,0.8), transparent)',
                'radial-gradient(circle 1px at 40% 20%, rgba(255,255,255,0.9), transparent)',
                'radial-gradient(circle 1px at 55% 60%, rgba(191,219,254,0.7), transparent)',
                'radial-gradient(circle 1px at 70% 30%, rgba(255,255,255,0.9), transparent)',
                'radial-gradient(circle 1px at 85% 70%, rgba(147,197,253,0.8), transparent)',
                'radial-gradient(circle 1px at 15% 75%, rgba(255,255,255,0.9), transparent)',
                'radial-gradient(circle 1px at 60% 85%, rgba(191,219,254,0.7), transparent)',
                'radial-gradient(circle 1px at 90% 10%, rgba(255,255,255,0.9), transparent)',
                'radial-gradient(circle 1px at 35% 90%, rgba(147,197,253,0.8), transparent)',
                'radial-gradient(circle 1px at 78% 48%, rgba(255,255,255,0.9), transparent)',
                'radial-gradient(circle 1px at 48% 33%, rgba(191,219,254,0.8), transparent)',
                'radial-gradient(circle 1px at 22% 62%, rgba(255,255,255,0.7), transparent)',
                'radial-gradient(circle 1px at 65% 18%, rgba(147,197,253,0.9), transparent)',
                'radial-gradient(circle 1px at 5% 38%, rgba(255,255,255,0.8), transparent)',
                'radial-gradient(circle 1px at 92% 55%, rgba(255,255,255,0.7), transparent)',
                'radial-gradient(circle 1px at 33% 8%, rgba(191,219,254,0.9), transparent)',
                'radial-gradient(circle 1px at 82% 88%, rgba(255,255,255,0.8), transparent)',
                'radial-gradient(circle 1px at 18% 95%, rgba(147,197,253,0.7), transparent)',
                'radial-gradient(circle 1px at 58% 72%, rgba(255,255,255,0.9), transparent)',
              ].join(', '),
              backgroundSize: '100% 100%',
            }} />
            {/* Layer 2: slightly larger accent stars */}
            <div className="absolute inset-0" style={{
              backgroundImage: [
                'radial-gradient(circle 1.5px at 5% 50%, rgba(96,165,250,0.9), transparent)',
                'radial-gradient(circle 1.5px at 75% 15%, rgba(255,255,255,0.95), transparent)',
                'radial-gradient(circle 1.5px at 50% 5%, rgba(191,219,254,0.9), transparent)',
                'radial-gradient(circle 2px at 30% 40%, rgba(255,255,255,0.8), transparent)',
                'radial-gradient(circle 2px at 88% 35%, rgba(96,165,250,0.85), transparent)',
                'radial-gradient(circle 1.5px at 45% 78%, rgba(147,197,253,0.9), transparent)',
                'radial-gradient(circle 2px at 12% 25%, rgba(255,255,255,0.85), transparent)',
                'radial-gradient(circle 1.5px at 67% 52%, rgba(191,219,254,0.8), transparent)',
              ].join(', '),
              backgroundSize: '100% 100%',
            }} />
          </div>
        )}
      </div>

      {/* Gradient overlay */}
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
            <motion.div
              className="relative z-10"
              whileHover={{ scale: 1.05 }}
              style={{ width: 240, height: 240 }}
            >
              {/* Glow ring — outside overflow-hidden so it doesn't bleed behind transparent PNG pixels */}
              <div className="absolute -inset-6 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
              {/* Logo container: dark bg fills any transparent areas in the PNG */}
              <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-950">
                <Image
                  src={spacLogo}
                  alt="St. Petersburg Astronomy Club"
                  width={240}
                  height={240}
                  className="relative z-10 w-full h-full object-contain"
                  priority
                />
              </div>
            </motion.div>

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
          <StarBorder as={Link} href="/register" color="#ef4444" speed="4s">
            <span className="flex items-center gap-2 text-lg font-semibold">
              Join Today
              <ArrowRight className="h-5 w-5" />
            </span>
          </StarBorder>
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
