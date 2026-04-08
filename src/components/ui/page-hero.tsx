'use client';

/**
 * PageHero — Unified animated hero for SPAC pages.
 *
 * Two modes:
 *  aurora-only  No photo → WebGL aurora fills the background
 *  photo+aurora → photo at base, cinematic gradient overlay, aurora for atmosphere
 *
 * Hard-line seam fix:
 *  The bottom fade uses `from-[30%]` so the lowest third is solid background.
 *  A `-bottom-10` offset bleeds 2.5 rem below the section boundary so there is
 *  literally no seam pixel where a colour jump can occur.
 *  Section never uses overflow-hidden (would clip the bleed).
 */

import dynamic from 'next/dynamic';

const Aurora = dynamic(() => import('@/components/animated/aurora'), {
  ssr: false,
  loading: () => null,
});

interface PageHeroProps {
  /** URL from page-builder hero_image key */
  photoUrl?: string | null;
  /** CSS object-position from hero_photo_position key (e.g. "top center") */
  photoPosition?: string | null;
  /** Three aurora colour stops */
  auroraColors?: [string, string, string];
  auroraAmplitude?: number;
  auroraBlend?: number;
  auroraSpeed?: number;
  /** Tailwind padding classes — override per-page if needed */
  className?: string;
  children: React.ReactNode;
}

export function PageHero({
  photoUrl,
  photoPosition,
  auroraColors = ['#6B21A8', '#0891B2', '#4F46E5'],
  auroraAmplitude = 1.2,
  auroraBlend = 0.6,
  auroraSpeed = 0.5,
  className = 'pt-20 pb-40',
  children,
}: PageHeroProps) {
  const hasPhoto = !!photoUrl;

  return (
    <section className={`relative w-full ${className}`}>

      {/* ── Photo (bottom of stack) ──────────────────────────────────────── */}
      {hasPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl!}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: photoPosition || 'center center' }}
        />
      )}

      {/* ── Overlay: darkens photo / stabilises bg for text legibility ──── */}
      {hasPhoto ? (
        /* Photo pages: cinematic top-dark → bg colour blend */
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, var(--background) 100%)',
          }}
        />
      ) : (
        /* Aurora-only pages: subtle tint so aurora reads on page bg */
        <div className="absolute inset-0 bg-background/10" />
      )}

      {/* ── Aurora ──────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{ opacity: hasPhoto ? 0.18 : 0.38 }}
      >
        <Aurora
          colorStops={auroraColors}
          amplitude={auroraAmplitude}
          blend={auroraBlend}
          speed={auroraSpeed}
        />
      </div>

      {/* ── Top fade: page-bg → transparent ─────────────────────────────── */}
      <div
        className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, var(--background) 0%, transparent 100%)',
        }}
      />

      {/* ── Bottom fade: hard-line fix ───────────────────────────────────
           • -bottom-10 bleeds 2.5rem below the section edge
           • bottom 30% is solid background → zero visible seam          */}
      <div
        className="absolute inset-x-0 -bottom-10 h-56 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, var(--background) 30%, color-mix(in srgb, var(--background) 70%, transparent) 60%, transparent 100%)',
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 relative z-10">
        {children}
      </div>
    </section>
  );
}
