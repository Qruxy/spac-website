'use client';

/**
 * BetaBanner
 *
 * Dismissible site-wide notice shown near the top of every public page.
 * Persists dismiss state in localStorage so it only shows once per browser.
 */

import { useEffect, useState } from 'react';
import { X, Construction } from 'lucide-react';

const DISMISS_KEY = 'spac_beta_banner_dismissed_v1';

export function BetaBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setVisible(true);
    } catch {
      // private browsing or storage blocked — show it
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* noop */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative z-50 w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5">
      <div className="container mx-auto flex items-center justify-between gap-4 max-w-6xl">
        <div className="flex items-center gap-2.5 text-sm text-amber-200/90 min-w-0">
          <Construction className="h-4 w-4 flex-shrink-0 text-amber-400" />
          <p className="leading-snug">
            <span className="font-semibold text-amber-300">Site update in progress.</span>
            {' '}We just went live and are still adding content. For questions or to confirm
            information, contact{' '}
            <a
              href="mailto:spacexaminer@gmail.com"
              className="underline hover:text-amber-200 transition-colors"
            >
              spacexaminer@gmail.com
            </a>
            .
          </p>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 rounded-md p-1 text-amber-400 hover:bg-amber-500/20 transition-colors"
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
