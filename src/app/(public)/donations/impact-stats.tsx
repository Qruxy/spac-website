'use client';

/**
 * Impact Stats Component
 *
 * Animated statistics showing the club's impact.
 */

// Direct imports to avoid barrel export bundle bloat
import { CountUp } from '@/components/animated/count-up';
import { GradientText } from '@/components/animated/gradient-text';

const stats = [
  { value: 300, label: 'Active Members', suffix: '+' },
  { value: 50, label: 'Public Events Yearly', suffix: '+' },
  { value: 12, label: 'Telescopes Maintained', suffix: '' },
  { value: 97, label: 'Years of Stargazing', suffix: '' },
];

export function ImpactStats() {
  return (
    <section className="py-16 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <GradientText
            className="text-3xl md:text-4xl font-bold"
            colors={['#818cf8', '#c084fc', '#f472b6']}
            animationSpeed={6}
          >
            Our Impact
          </GradientText>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            For nearly a century, SPAC has been inspiring wonder and fostering a love of astronomy.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-card/50 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                <CountUp to={stat.value} duration={2.5} />
                <span>{stat.suffix}</span>
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
