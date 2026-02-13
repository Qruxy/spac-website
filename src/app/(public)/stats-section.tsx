'use client';

/**
 * Stats Section Component
 *
 * Displays animated statistics with digit roller counters that animate when scrolled into view.
 * Uses DigitCounter for the rolling digit effect and GradualBlur for the header.
 */

import { DigitCounter } from '@/components/animated/digit-counter';
import { GradualBlur } from '@/components/animated/gradual-blur';
import { FadeIn } from '@/components/animated/fade-in';

interface Stat {
  value: number;
  label: string;
  suffix: string;
}

interface StatsSectionProps {
  stats: Stat[];
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="bg-primary/5 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <GradualBlur
            text="Our Legacy in Numbers"
            as="h2"
            className="text-3xl font-bold text-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={index * 0.1}>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary sm:text-5xl flex items-center justify-center">
                  <DigitCounter
                    value={stat.value}
                    suffix={stat.suffix || undefined}
                    className="tabular-nums"
                    digitHeight={48}
                    digitWidth={30}
                  />
                </div>
                <div className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {stat.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
