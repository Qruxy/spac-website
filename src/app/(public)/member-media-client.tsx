'use client';

/**
 * Member Media Client Component
 *
 * Client-side wrapper for BounceCards animation.
 * Handles responsive sizing and hover interactions.
 */

import { useEffect, useState } from 'react';
import BounceCards from '@/components/BounceCards';

interface MemberMediaClientProps {
  images: string[];
}

export function MemberMediaClient({ images }: MemberMediaClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMounted) {
    // SSR placeholder — matches new larger card sizes
    return (
      <div className="w-full max-w-[900px] h-[420px] sm:h-[520px] flex items-center justify-center">
        <div className="animate-pulse bg-muted rounded-[20px] w-[240px] h-[240px] sm:w-[300px] sm:h-[300px]" />
      </div>
    );
  }

  // Responsive transform styles — translate values scale with card size (300px desktop, 240px mobile)
  const mobileTransformStyles = [
    'rotate(8deg) translate(-120px)',
    'rotate(4deg) translate(-60px)',
    'rotate(-2deg)',
    'rotate(-6deg) translate(60px)',
    'rotate(3deg) translate(120px)',
  ];

  const desktopTransformStyles = [
    'rotate(10deg) translate(-255px)',
    'rotate(5deg) translate(-128px)',
    'rotate(-3deg)',
    'rotate(-10deg) translate(128px)',
    'rotate(2deg) translate(255px)',
  ];

  return (
    <div className="relative">
      {/* Ambient glow effect behind cards */}
      <div className="absolute inset-0 blur-3xl opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary rounded-full" />
      </div>

      <BounceCards
        className="relative z-10"
        images={images}
        containerWidth={isMobile ? 520 : 900}
        containerHeight={isMobile ? 420 : 520}
        animationDelay={0.3}
        animationStagger={0.08}
        easeType="elastic.out(1, 0.8)"
        transformStyles={isMobile ? mobileTransformStyles : desktopTransformStyles}
        enableHover={!isMobile}
        cardSize={isMobile ? 240 : 300}
      />
    </div>
  );
}
