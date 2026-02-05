'use client';

/**
 * CircularText Component
 *
 * Displays text in a circular path around a center element.
 * Uses motion library for smooth spinning animations.
 *
 * Based on ReactBits component pattern.
 */

import React, { useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'motion/react';

interface CircularTextProps {
  text: string;
  spinDuration?: number;
  onHover?: 'slowDown' | 'speedUp' | 'pause' | 'goBonkers';
  className?: string;
}

const getRotationTransition = (
  duration: number,
  from: number,
  loop: boolean = true
) => ({
  rotate: {
    from,
    to: from + 360,
    ease: 'linear' as const,
    duration,
    repeat: loop ? Infinity : 0,
  },
});

const getTransition = (duration: number, from: number) =>
  getRotationTransition(duration, from, true);

const CHARACTERS = (text: string) => {
  const chars = text.split('');
  const angle = 360 / chars.length;
  return chars.map((char, i) => ({
    char,
    angle: i * angle,
  }));
};

export function CircularText({
  text,
  spinDuration = 20,
  onHover = 'speedUp',
  className = '',
}: CircularTextProps) {
  const controls = useAnimation();
  const rotation = useMotionValue(0);

  useEffect(() => {
    controls.start({
      rotate: [rotation.get(), rotation.get() + 360],
      transition: {
        duration: spinDuration,
        ease: 'linear',
        repeat: Infinity,
      },
    });
  }, [spinDuration, controls, rotation]);

  const handleHoverStart = () => {
    const currentRotation = rotation.get();

    switch (onHover) {
      case 'pause':
        controls.stop();
        break;
      case 'slowDown':
        controls.start({
          rotate: [currentRotation, currentRotation + 360],
          transition: {
            duration: spinDuration * 2,
            ease: 'linear',
            repeat: Infinity,
          },
        });
        break;
      case 'speedUp':
        controls.start({
          rotate: [currentRotation, currentRotation + 360],
          transition: {
            duration: spinDuration / 4,
            ease: 'linear',
            repeat: Infinity,
          },
        });
        break;
      case 'goBonkers':
        controls.start({
          rotate: [currentRotation, currentRotation + 360],
          transition: {
            duration: spinDuration / 20,
            ease: 'linear',
            repeat: Infinity,
          },
        });
        break;
    }
  };

  const handleHoverEnd = () => {
    const currentRotation = rotation.get();
    controls.start({
      rotate: [currentRotation, currentRotation + 360],
      transition: {
        duration: spinDuration,
        ease: 'linear',
        repeat: Infinity,
      },
    });
  };

  return (
    <motion.div
      initial={{ rotate: 0 }}
      animate={controls}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      style={{ rotate: rotation }}
      onUpdate={(latest) => rotation.set(Number(latest.rotate))}
      className={`circular-text ${className}`}
    >
      <span className="circular-text__wrapper">
        {CHARACTERS(text).map(({ char, angle }, i) => (
          <span
            key={`${char}-${i}`}
            className="circular-text__char"
            style={
              { '--char-rotate': `${angle}deg` } as React.CSSProperties
            }
          >
            {char}
          </span>
        ))}
      </span>
    </motion.div>
  );
}

export default CircularText;
