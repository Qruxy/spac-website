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
    // SSR placeholder
    return (
      <div className="w-[400px] h-[400px] md:w-[600px] md:h-[400px] flex items-center justify-center">
        <div className="animate-pulse bg-muted rounded-[20px] w-[200px] h-[200px]" />
      </div>
    );
  }

  // Responsive transform styles
  const mobileTransformStyles = [
    'rotate(8deg) translate(-80px)',
    'rotate(4deg) translate(-40px)',
    'rotate(-2deg)',
    'rotate(-6deg) translate(40px)',
    'rotate(3deg) translate(80px)',
  ];

  const desktopTransformStyles = [
    'rotate(10deg) translate(-170px)',
    'rotate(5deg) translate(-85px)',
    'rotate(-3deg)',
    'rotate(-10deg) translate(85px)',
    'rotate(2deg) translate(170px)',
  ];

  return (
    <div className="relative">
      {/* Ambient glow effect behind cards */}
      <div className="absolute inset-0 blur-3xl opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary rounded-full" />
      </div>

      <BounceCards
        className="relative z-10"
        images={images}
        containerWidth={isMobile ? 350 : 600}
        containerHeight={isMobile ? 350 : 400}
        animationDelay={0.3}
        animationStagger={0.08}
        easeType="elastic.out(1, 0.8)"
        transformStyles={isMobile ? mobileTransformStyles : desktopTransformStyles}
        enableHover={!isMobile}
      />
    </div>
  );
}
