'use client';

/**
 * Stats Section Component
 *
 * Displays animated statistics counters that count up when scrolled into view.
 * Enhanced with React Bits CountUp component for smoother spring physics.
 */

// Direct imports to avoid barrel export bundle bloat
import { CountUp } from '@/components/animated/count-up';
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
        <FadeIn>
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Our Legacy in Numbers
          </h2>
        </FadeIn>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={index * 0.1}>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary sm:text-5xl">
                  <CountUp
                    to={stat.value}
                    duration={2.5}
                    delay={index * 0.15}
                    separator=","
                    className="tabular-nums"
                  />
                  {stat.suffix}
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
