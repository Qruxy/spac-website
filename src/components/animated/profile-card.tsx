'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

interface ProfileCardProps {
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  handle?: string;
  className?: string;
  badge?: string;
  badgeColor?: string;
}

export function ProfileCard({
  name,
  subtitle,
  avatarUrl,
  handle,
  className = '',
  badge,
  badgeColor = '#3b82f6',
}: ProfileCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-0 blur-3xl"
        animate={{ opacity: isHovered ? 0.2 : 0 }}
        style={{ background: badgeColor }}
      />

      <div className="relative z-10 flex flex-col items-center p-6 text-center">
        {/* Avatar */}
        <motion.div
          className="relative mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-white/10 bg-slate-700"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-300">
              {initials}
            </div>
          )}
        </motion.div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-white">{name}</h3>

        {/* Handle */}
        {handle && (
          <p className="mt-0.5 text-sm text-slate-400">@{handle}</p>
        )}

        {/* Subtitle / Plan badge */}
        {subtitle && (
          <span
            className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${badgeColor}20`,
              color: badgeColor,
              border: `1px solid ${badgeColor}40`,
            }}
          >
            {subtitle}
          </span>
        )}

        {/* Optional badge */}
        {badge && (
          <span
            className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${badgeColor}20`,
              color: badgeColor,
              border: `1px solid ${badgeColor}40`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default ProfileCard;
