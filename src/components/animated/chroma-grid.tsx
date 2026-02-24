'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail } from 'lucide-react';

interface ChromaGridItem {
  id: string;
  image?: string;
  title: string;
  subtitle?: string;
  bio?: string | null;
  email?: string | null;
  color?: string;
  content?: ReactNode; // legacy override — use title/subtitle/bio/email instead
}

interface ChromaGridProps {
  items: ChromaGridItem[];
  className?: string;
  columns?: number;
}

export function ChromaGrid({ items, className = '', columns = 3 }: ChromaGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const defaultColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#10b981',
    '#f43f5e', '#6366f1', '#14b8a6', '#f59e0b', '#84cc16', '#a855f7',
  ];

  const colClasses =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : columns === 4
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid gap-4 ${colClasses} ${className}`}>
      {items.map((item, index) => {
        const color = item.color || defaultColors[index % defaultColors.length];
        const isHovered = hoveredId === item.id;

        return (
          <motion.div
            key={item.id}
            className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60 cursor-pointer"
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            {/* Color tint overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0 z-10 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.18 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  style={{ backgroundColor: color }}
                />
              )}
            </AnimatePresence>

            {/* Image — greyscale by default, full colour on hover */}
            {item.image && (
              <div className="absolute inset-0 z-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className={`
                    h-full w-full object-cover
                    transition-all duration-500 ease-in-out
                    group-hover:scale-105
                    grayscale group-hover:grayscale-0
                  `}
                />
                {/* Gradient: slightly heavier on hover to keep text legible over colourful photo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500" />
              </div>
            )}

            {/* Content */}
            <div className="relative z-20 flex h-full flex-col justify-end p-5">
              {item.content ? (
                // Legacy override
                item.content
              ) : (
                <>
                  {/* Bio — slides up and fades in on hover */}
                  <AnimatePresence>
                    {isHovered && item.bio && (
                      <motion.p
                        className="mb-3 text-xs leading-relaxed text-slate-300 line-clamp-4"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                      >
                        {item.bio}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Name + role — always visible */}
                  <h3 className="text-lg font-semibold text-white leading-tight">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p
                      className="mt-1 text-sm font-medium transition-colors duration-300"
                      style={{ color: isHovered ? color : '#94a3b8' }}
                    >
                      {item.subtitle}
                    </p>
                  )}

                  {/* Email — fades in on hover */}
                  <AnimatePresence>
                    {isHovered && item.email && (
                      <motion.a
                        href={`mailto:${item.email}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: 0.05 }}
                      >
                        <Mail className="h-3 w-3" />
                        Contact
                      </motion.a>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Bottom colour accent line */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 z-20"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ backgroundColor: color, transformOrigin: 'left' }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

export type { ChromaGridItem };
export default ChromaGrid;
