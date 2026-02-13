'use client';

import { useRef, useState, ReactNode } from 'react';
import { motion } from 'motion/react';

interface BentoTileProps {
  children: ReactNode;
  className?: string;
  spotlight?: boolean;
}

function BentoTile({ children, className = '', spotlight = true }: BentoTileProps) {
  const tileRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tileRef.current || !spotlight) return;
    const rect = tileRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={tileRef}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/80 backdrop-blur-sm ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
    >
      {spotlight && isHovered && (
        <div
          className="pointer-events-none absolute z-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            left: mousePos.x,
            top: mousePos.y,
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5), transparent 70%)',
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

interface MagicBentoProps {
  children: ReactNode;
  className?: string;
}

function MagicBento({ children, className = '' }: MagicBentoProps) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {children}
    </div>
  );
}

MagicBento.Tile = BentoTile;

export { MagicBento, BentoTile };
export default MagicBento;
