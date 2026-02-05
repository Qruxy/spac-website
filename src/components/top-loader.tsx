'use client';

/**
 * Top Loader
 *
 * Shows a progress bar at the top of the page during navigation.
 * Uses Next.js navigation events to detect route changes.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setProgress(0);

    // Quickly move to 30%, then slowly increment
    setTimeout(() => setProgress(30), 50);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Slow down as we get closer to 90
        const increment = Math.max(1, (90 - prev) / 10);
        return Math.min(90, prev + increment);
      });
    }, 200);
  }, []);

  const completeLoading = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setProgress(100);

    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 300);
  }, []);

  useEffect(() => {
    // Complete loading when route changes
    completeLoading();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pathname, searchParams, completeLoading]);

  // Intercept link clicks to start loading
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip external links, hash links, and download links
      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.getAttribute('download') !== null ||
        anchor.getAttribute('target') === '_blank'
      ) {
        return;
      }

      // Skip if same page
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      startLoading();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [startLoading]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 shadow-lg shadow-primary/30 transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: loading ? 1 : 0,
        }}
      />
      {loading && (
        <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-r from-transparent to-primary/50 animate-pulse" />
      )}
    </div>
  );
}
