'use client';

/**
 * Lanyard Demo Page
 *
 * Test page for the 3D interactive membership card lanyard.
 */

import dynamic from 'next/dynamic';

const Lanyard = dynamic(
  () => import('@/components/animated/lanyard/Lanyard'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading 3D scene...</div>
      </div>
    )
  }
);

export default function LanyardDemoPage() {
  return (
    <div className="relative w-full h-screen bg-slate-900">
      <Lanyard />
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-sm text-center">
        <p>Drag the membership card to interact</p>
        <p className="mt-1 text-xs">SPAC Membership Card Demo</p>
      </div>
    </div>
  );
}
