'use client';

/**
 * Animated Counter Component
 *
 * Animates a number counting up when it enters the viewport.
 */

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
  formatFn?: (value: number) => string;
}

export function AnimatedCounter({
  value,
  className = '',
  duration = 2,
  formatFn = (v) => Math.round(v).toLocaleString(),
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => formatFn(latest));
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration,
        ease: 'easeOut',
        onUpdate: (latest) => {
          setDisplayValue(formatFn(latest));
        },
      });

      return controls.stop;
    }
  }, [isInView, value, duration, count, formatFn]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}
