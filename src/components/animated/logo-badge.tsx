'use client';

/**
 * LogoBadge Component
 *
 * Combines the SPAC logo with animated circular text spinning around it.
 * Creates an eye-catching animated badge for the hero section.
 */

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { CircularText } from './circular-text';
import './circular-text.css';

interface LogoBadgeProps {
  text?: string;
  size?: number;
  className?: string;
  spinDuration?: number;
  onHover?: 'slowDown' | 'speedUp' | 'pause' | 'goBonkers';
}

export function LogoBadge({
  text = '★ ST. PETE ASTRONOMY CLUB ★ SINCE 1927 ★ TAMPA BAY ',
  size = 280,
  className = '',
  spinDuration = 20,
  onHover = 'speedUp',
}: LogoBadgeProps) {
  const logoSize = size * 0.5; // Logo is 50% of overall size

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        // CSS custom properties for CircularText
        '--radius': size / 2,
        '--font-size': `${size / 22}px`,
      } as React.CSSProperties}
    >
      {/* Spinning Text Ring */}
      <div className="absolute inset-0">
        <CircularText
          text={text}
          spinDuration={spinDuration}
          onHover={onHover}
          className="text-primary"
        />
      </div>

      {/* Center Logo with glow effect */}
      <motion.div
        className="relative z-10 rounded-full overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        whileHover={{ scale: 1.05 }}
        style={{
          width: logoSize,
          height: logoSize,
        }}
      >
        {/* Glow ring */}
        <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl" />

        {/* Logo */}
        <Image
          src="/images/spac-logo.png"
          alt="St. Petersburg Astronomy Club"
          width={logoSize}
          height={logoSize}
          className="relative z-10 rounded-full object-contain bg-white/90 p-1"
          priority
        />
      </motion.div>

      {/* Decorative ring */}
      <div
        className="absolute rounded-full border border-primary/30"
        style={{
          width: logoSize + 20,
          height: logoSize + 20,
        }}
      />
    </div>
  );
}

export default LogoBadge;
