'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ChromaGridItem {
  id: string;
  image?: string;
  title: string;
  subtitle?: string;
  color?: string;
  content?: ReactNode;
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
            {/* Color overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0 z-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ backgroundColor: color }}
                />
              )}
            </AnimatePresence>

            {/* Image */}
            {item.image && (
              <div className="absolute inset-0 z-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>
            )}

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col justify-end p-5">
              {item.content || (
                <>
                  <h3 className="text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="mt-1 text-sm text-slate-300">
                      {item.subtitle}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Bottom color accent line */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5"
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
