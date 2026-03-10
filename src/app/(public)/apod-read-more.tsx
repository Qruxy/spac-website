'use client';

/**
 * APOD Read More Toggle — client wrapper for expand/collapse explanation
 */

import { useState } from 'react';

export function APODReadMore({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const SHORT_LEN = 300;
  const needsTruncation = text.length > SHORT_LEN;
  const displayText = expanded || !needsTruncation ? text : text.slice(0, SHORT_LEN) + '…';

  return (
    <div>
      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{displayText}</p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-primary hover:underline text-sm font-medium"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
