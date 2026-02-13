'use client';

import { useRef } from 'react';
import { motion, useInView, Variant } from 'motion/react';

interface GradualBlurProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

export function GradualBlur({
  text,
  className = '',
  delay = 0,
  duration = 0.5,
  as: Tag = 'p',
}: GradualBlurProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const words = text.split(' ');

  const hidden: Variant = {
    filter: 'blur(10px)',
    opacity: 0,
    y: 5,
  };

  const visible: Variant = {
    filter: 'blur(0px)',
    opacity: 1,
    y: 0,
  };

  return (
    <Tag ref={ref as React.RefObject<any>} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={hidden}
          animate={isInView ? visible : hidden}
          transition={{
            delay: delay + i * 0.08,
            duration,
            ease: 'easeOut',
          }}
          style={{ display: 'inline-block', marginRight: '0.25em' }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}

export default GradualBlur;
