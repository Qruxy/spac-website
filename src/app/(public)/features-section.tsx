'use client';

/**
 * Features Section Component
 *
 * Displays club features with spotlight card effects and fade-in animations.
 */

import {
  Moon,
  Mic2,
  Star,
  Telescope,
  School,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
// Direct imports to avoid barrel export bundle bloat
import { SpotlightCard } from '@/components/animated/spotlight-card';
import { FadeIn } from '@/components/animated/fade-in';
import { GradualBlur } from '@/components/animated/gradual-blur';

// Icon mapping - icons must be defined in client component
const iconMap: Record<string, LucideIcon> = {
  Moon,
  Mic2,
  Star,
  Telescope,
  School,
  ShoppingBag,
};

interface Feature {
  title: string;
  description: string;
  iconName: string;
}

interface FeaturesSectionProps {
  features: Feature[];
}

export function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <GradualBlur
            text="What We Offer"
            as="h2"
            className="mb-4 text-3xl font-bold text-foreground"
          />
          <FadeIn delay={0.3}>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              From monthly star parties to hands-on telescope building, SPAC offers
              something for astronomers of all skill levels.
            </p>
          </FadeIn>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = iconMap[feature.iconName] || Star;
            return (
              <FadeIn key={feature.title} delay={index * 0.1}>
                <SpotlightCard className="h-full rounded-xl border border-border bg-card p-6">
                  <Icon className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </SpotlightCard>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
