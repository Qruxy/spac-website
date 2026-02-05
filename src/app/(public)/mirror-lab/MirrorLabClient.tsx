'use client';

/**
 * Mirror Lab Client Components
 *
 * Interactive and animated components for the Mirror Lab page.
 */

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'motion/react';
// Direct imports to avoid barrel export bundle bloat
import { GradientText } from '@/components/animated/gradient-text';
import { CountUp } from '@/components/animated/count-up';
import { Sparkles } from 'lucide-react';

export function MirrorLabHero() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-background">
      {/* Starfield effect */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Hands-On Telescope Making</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          <GradientText
            colors={['#818cf8', '#c084fc', '#f472b6', '#818cf8']}
            animationSpeed={6}
            className="text-5xl md:text-7xl font-bold"
          >
            Mirror Lab
          </GradientText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-2xl md:text-3xl text-slate-300 max-w-3xl mx-auto mb-8"
        >
          Build your own telescope from scratch
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-8"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-white">
              <CountUp to={60} duration={2} />+
            </div>
            <div className="text-sm text-slate-400">Years of ATM Tradition</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">
              <CountUp to={100} duration={2} />+
            </div>
            <div className="text-sm text-slate-400">Mirrors Completed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">
              6&quot; - 16&quot;
            </div>
            <div className="text-sm text-slate-400">Mirror Sizes</div>
          </div>
        </motion.div>
      </div>

      {/* Decorative mirror illustration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
        <div className="w-full h-full rounded-[50%] bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600 blur-sm" />
      </div>
    </section>
  );
}

interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  delay?: number;
}

export function ProcessStep({ step, title, description, delay = 0 }: ProcessStepProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay }}
      className="relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all group"
    >
      {/* Step number */}
      <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg group-hover:scale-110 transition-transform">
        {step}
      </div>

      <div className="pt-4">
        <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Connecting line (hidden on last item) */}
      {step < 6 && (
        <div className="hidden lg:block absolute -right-3 top-1/2 w-6 h-0.5 bg-border" />
      )}
    </motion.div>
  );
}

interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
}

interface MirrorLabGalleryProps {
  images: GalleryImage[];
}

export function MirrorLabGallery({ images }: MirrorLabGalleryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <GalleryItem key={index} image={image} index={index} />
      ))}
    </div>
  );
}

function GalleryItem({ image, index }: { image: GalleryImage; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative aspect-[3/2] rounded-xl overflow-hidden cursor-pointer"
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white text-sm font-medium">{image.caption}</p>
      </div>
    </motion.div>
  );
}
