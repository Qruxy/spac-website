'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring, animate } from 'motion/react';

interface DigitProps {
  value: number;
  className?: string;
  digitHeight?: number;
  digitWidth?: number;
}

function Digit({ value, className = '', digitHeight = 40, digitWidth = 24 }: DigitProps) {
  const y = useMotionValue(0);
  const spring = useSpring(y, { stiffness: 120, damping: 20 });

  useEffect(() => {
    y.set(-value * digitHeight);
  }, [value, y, digitHeight]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height: digitHeight, width: digitWidth }}>
      <motion.div className="absolute" style={{ y: spring }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <div
            key={digit}
            className="flex items-center justify-center text-inherit"
            style={{ height: digitHeight }}
          >
            {digit}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

interface DigitCounterProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  triggerOnView?: boolean;
  digitHeight?: number;
  digitWidth?: number;
}

export function DigitCounter({
  value,
  className = '',
  prefix,
  suffix,
  triggerOnView = true,
  digitHeight = 40,
  digitWidth = 24,
}: DigitCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState(triggerOnView ? 0 : value);

  useEffect(() => {
    if (triggerOnView && isInView) {
      setDisplayValue(value);
    }
  }, [isInView, value, triggerOnView]);

  useEffect(() => {
    if (!triggerOnView) {
      setDisplayValue(value);
    }
  }, [value, triggerOnView]);

  const digits = String(displayValue).split('').map(Number);

  return (
    <div ref={ref} className={`inline-flex items-center ${className}`}>
      {prefix && <span className="mr-1">{prefix}</span>}
      <div className="flex">
        {digits.map((digit, i) => (
          <Digit key={`${i}-${digits.length}`} value={digit} digitHeight={digitHeight} digitWidth={digitWidth} />
        ))}
      </div>
      {suffix && <span className="ml-1">{suffix}</span>}
    </div>
  );
}

export default DigitCounter;
