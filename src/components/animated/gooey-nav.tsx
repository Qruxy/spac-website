'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion } from 'motion/react';

interface NavItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

interface GooeyNavProps {
  items: NavItem[];
  activeIndex?: number;
  className?: string;
  accentColor?: string;
  onItemClick?: (index: number) => void;
}

export function GooeyNav({
  items,
  activeIndex: controlledIndex,
  className = '',
  accentColor = '#3b82f6',
  onItemClick,
}: GooeyNavProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex ?? internalIndex;
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!navRef.current) return;
    const buttons = navRef.current.querySelectorAll<HTMLButtonElement>('[data-nav-item]');
    const activeBtn = buttons[activeIndex];
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [activeIndex]);

  const handleClick = (index: number) => {
    setInternalIndex(index);
    onItemClick?.(index);
    items[index].onClick?.();
  };

  return (
    <div
      ref={navRef}
      className={`relative inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-slate-900/80 p-1.5 backdrop-blur-sm ${className}`}
    >
      {/* Animated blob indicator */}
      <motion.div
        className="absolute top-1.5 bottom-1.5 rounded-full"
        style={{ backgroundColor: accentColor }}
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      />

      {items.map((item, index) => (
        <button
          key={item.label}
          data-nav-item
          onClick={() => handleClick(index)}
          className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeIndex === index
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export type { NavItem };
export default GooeyNav;
