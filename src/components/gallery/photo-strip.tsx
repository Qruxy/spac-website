'use client';

/**
 * PhotoStrip — infinite-scroll photo ticker.
 *
 * Pure CSS animation, no WebGL, no canvas. Two identical rows scrolling in
 * opposite directions so the strip always looks full regardless of how many
 * photos are available.
 */

import Image from 'next/image';
import { useState } from 'react';

interface StripPhoto {
  image: string;
  text: string;
}

interface PhotoStripProps {
  photos: StripPhoto[];
  /** Height of each tile in pixels. Default 220. */
  height?: number;
}

export function PhotoStrip({ photos, height = 220 }: PhotoStripProps) {
  // Need at least 3 photos to look reasonable
  if (!photos || photos.length < 3) return null;

  // Triple the array so the seamless loop looks full at all speeds
  const tiles = photos.length < 8 ? [...photos, ...photos, ...photos] : [...photos, ...photos];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-slate-900/60 border border-border"
      style={{ height }}
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />

      {/* Scrolling track */}
      <div
        className="flex gap-3 items-center h-full"
        style={{
          width: 'max-content',
          animation: `photo-strip-scroll ${tiles.length * 3}s linear infinite`,
        }}
      >
        {tiles.map((photo, i) => (
          <PhotoTile key={i} photo={photo} height={height} />
        ))}
      </div>

      <style>{`
        @keyframes photo-strip-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .photo-strip-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

function PhotoTile({ photo, height }: { photo: StripPhoto; height: number }) {
  const [errored, setErrored] = useState(false);
  const tileWidth = Math.round(height * 1.4);

  return (
    <div
      className="relative flex-shrink-0 rounded-xl overflow-hidden group cursor-pointer"
      style={{ width: tileWidth, height: height - 8 }}
    >
      {errored ? (
        <div
          className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-medium px-2 text-center"
          style={{ width: tileWidth, height: height - 8 }}
        >
          {photo.text}
        </div>
      ) : (
        <>
          <Image
            src={photo.image}
            alt={photo.text}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={`${tileWidth}px`}
            onError={() => setErrored(true)}
            unoptimized
          />
          {/* Caption overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-white text-xs font-medium truncate">{photo.text}</p>
          </div>
        </>
      )}
    </div>
  );
}
