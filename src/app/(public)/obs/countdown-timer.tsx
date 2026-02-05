'use client';

/**
 * Countdown Timer Component
 *
 * Displays a countdown to the OBS event with flip-style animation.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function FlipCard({ value, label }: { value: number; label: string }) {
  const displayValue = value.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Background card */}
        <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/10 overflow-hidden">
          {/* Top half */}
          <div className="h-1/2 flex items-end justify-center border-b border-slate-700/50 bg-slate-800/50">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={displayValue}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="text-3xl sm:text-4xl font-bold text-white tabular-nums pb-1"
              >
                {displayValue}
              </motion.span>
            </AnimatePresence>
          </div>
          {/* Bottom half reflection */}
          <div className="h-1/2 bg-gradient-to-b from-slate-800/80 to-slate-900" />
        </div>
        
        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-700/50 transform -translate-y-1/2" />
        
        {/* Side notches */}
        <div className="absolute top-1/2 -left-1 w-2 h-3 bg-slate-950 rounded-r transform -translate-y-1/2" />
        <div className="absolute top-1/2 -right-1 w-2 h-3 bg-slate-950 rounded-l transform -translate-y-1/2" />
      </div>
      
      <span className="mt-2 text-xs sm:text-sm font-medium text-amber-400/80 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({ targetDate, label = 'Event Starts In' }: CountdownTimerProps) {
  const calculateTimeLeft = useCallback((): TimeLeft => {
    const difference = targetDate.getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0
      ) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (isExpired) {
    return (
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/20 border border-amber-500/30 rounded-full"
        >
          <span className="text-xl font-bold text-amber-400">🎉 Event is Live!</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-slate-400 text-sm sm:text-base mb-4 uppercase tracking-wider">
        {label}
      </p>
      
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <FlipCard value={timeLeft.days} label="Days" />
        <span className="text-2xl sm:text-3xl text-amber-500 font-bold mt-[-1.5rem]">:</span>
        <FlipCard value={timeLeft.hours} label="Hours" />
        <span className="text-2xl sm:text-3xl text-amber-500 font-bold mt-[-1.5rem]">:</span>
        <FlipCard value={timeLeft.minutes} label="Mins" />
        <span className="text-2xl sm:text-3xl text-amber-500 font-bold mt-[-1.5rem]">:</span>
        <FlipCard value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  );
}

export default CountdownTimer;
