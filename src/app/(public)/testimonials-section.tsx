'use client';

/**
 * Testimonials Section
 *
 * Carousel of member testimonials with smooth animations.
 * Uses infinite scroll animation for a seamless experience.
 */

import { useEffect, useState, useCallback } from 'react';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  memberSince?: string;
  stars?: number;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Mike R.',
    role: 'Family Member',
    content:
      'SPAC opened up the universe to my family. Our kids now look forward to every new moon star party, and they can identify more constellations than most adults!',
    memberSince: '2018',
    stars: 5,
  },
  {
    id: '2',
    name: 'Dr. Sarah K.',
    role: 'Lifetime Member',
    content:
      'The mirror lab is an incredible resource. I ground my first 8-inch mirror there, and the mentorship from experienced members was invaluable. Truly a hidden gem in Tampa Bay.',
    memberSince: '2012',
    stars: 5,
  },
  {
    id: '3',
    name: 'James T.',
    role: 'Active Member',
    content:
      'Best astronomy club in Florida! The Orange Blossom Special is the highlight of my year. Dark skies, great people, and incredible views of the cosmos.',
    memberSince: '2020',
    stars: 5,
  },
  {
    id: '4',
    name: 'Linda M.',
    role: 'Outreach Volunteer',
    content:
      "Sharing the wonder of the night sky with school kids is the most rewarding thing I've ever done. SPAC's outreach program is well-organized and truly impactful.",
    memberSince: '2015',
    stars: 5,
  },
  {
    id: '5',
    name: 'Robert P.',
    role: 'New Member',
    content:
      "As a complete beginner, I was worried I wouldn't fit in. The members at my first star party were so welcoming and let me look through incredible telescopes. I was hooked immediately!",
    memberSince: '2024',
    stars: 5,
  },
  {
    id: '6',
    name: 'Elena V.',
    role: 'Astrophotographer',
    content:
      "The club's dark sky site at Withlacoochee is perfect for imaging. I've captured my best deep sky photos there, and the community feedback has helped me improve tremendously.",
    memberSince: '2019',
    stars: 5,
  },
];

function TestimonialCard({ testimonial, isActive = false }: { testimonial: Testimonial; isActive?: boolean }) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-card p-6 transition-all duration-500',
        isActive
          ? 'border-primary/50 shadow-lg shadow-primary/10 scale-100 opacity-100'
          : 'border-border scale-95 opacity-60'
      )}
    >
      {/* Quote Icon */}
      <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />

      {/* Stars */}
      {testimonial.stars && (
        <div className="flex gap-1 mb-4">
          {Array.from({ length: testimonial.stars }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
      )}

      {/* Content */}
      <p className="text-foreground/90 italic leading-relaxed mb-6">
        &ldquo;{testimonial.content}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {testimonial.name[0]}
        </div>
        <div>
          <p className="font-semibold text-foreground">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">
            {testimonial.role}
            {testimonial.memberSince && ` • Member since ${testimonial.memberSince}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextTestimonial = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  // Auto-advance testimonials
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextTestimonial();
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused, nextTestimonial]);

  // Get visible testimonials (current + neighbors for mobile carousel)
  const getVisibleIndices = () => {
    const prev = (currentIndex - 1 + testimonials.length) % testimonials.length;
    const next = (currentIndex + 1) % testimonials.length;
    return { prev, current: currentIndex, next };
  };

  const { prev, current, next } = getVisibleIndices();

  return (
    <section className="py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            What Our Members Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join a community of passionate stargazers who share the wonder of the night sky.
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Desktop: Show 3 cards */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            <div className="opacity-60 scale-95 transition-all duration-500">
              <TestimonialCard testimonial={testimonials[prev]} />
            </div>
            <div className="scale-100 opacity-100 transition-all duration-500">
              <TestimonialCard testimonial={testimonials[current]} isActive />
            </div>
            <div className="opacity-60 scale-95 transition-all duration-500">
              <TestimonialCard testimonial={testimonials[next]} />
            </div>
          </div>

          {/* Mobile: Show 1 card */}
          <div className="md:hidden">
            <TestimonialCard testimonial={testimonials[current]} isActive />
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 p-2 rounded-full bg-card border border-border hover:border-primary/50 hover:bg-primary/10 transition-all"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 p-2 rounded-full bg-card border border-border hover:border-primary/50 hover:bg-primary/10 transition-all"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  index === current
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
