'use client';

/**
 * BeamsDivider - Animated section divider using Beams effect
 * 
 * Creates a visually striking transition between sections.
 */

import dynamic from 'next/dynamic';

// Dynamic import for WebGL Beams component to avoid SSR issues
const Beams = dynamic(() => import('@/components/animated/beams'), {
  ssr: false,
  loading: () => <div className="h-32 bg-black" />,
});

interface BeamsDividerProps {
  className?: string;
  lightColor?: string;
  beamNumber?: number;
  rotation?: number;
}

export function BeamsDivider({
  className = '',
  lightColor = '#6B21A8',
  beamNumber = 8,
  rotation = 0,
}: BeamsDividerProps) {
  return (
    <div className={`relative h-32 w-full overflow-hidden ${className}`}>
      <Beams
        beamWidth={3}
        beamHeight={20}
        beamNumber={beamNumber}
        lightColor={lightColor}
        speed={1.5}
        noiseIntensity={1.5}
        scale={0.15}
        rotation={rotation}
      />
    </div>
  );
}
