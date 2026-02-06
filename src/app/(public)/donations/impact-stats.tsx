'use client';

/**
 * Impact Stats Component
 *
 * Animated statistics showing the club's impact.
 * Clean, minimal Apple-like presentation.
 */

import { CountUp } from '@/components/animated/count-up';

const stats = [
  { value: 300, label: 'Active Members', suffix: '+' },
  { value: 50, label: 'Public Events Yearly', suffix: '+' },
  { value: 12, label: 'Telescopes Maintained', suffix: '' },
  { value: 97, label: 'Years of Stargazing', suffix: '' },
];

export function ImpactStats() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2 tabular-nums">
                <CountUp to={stat.value} duration={2.5} />
                <span className="text-primary">{stat.suffix}</span>
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
