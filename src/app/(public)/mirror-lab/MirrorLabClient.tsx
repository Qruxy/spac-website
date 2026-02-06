'use client';

/**
 * Mirror Lab Client Components
 *
 * Interactive and animated components for the Mirror Lab page.
 * Clean design with subtle scroll-triggered animations.
 */

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'motion/react';
import { GradientText } from '@/components/animated/gradient-text';
import { CountUp } from '@/components/animated/count-up';

export function MirrorLabHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950/50 to-background">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="relative z-10 container mx-auto px-4 py-32 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-6xl md:text-8xl lg:text-9xl font-bold mb-6 tracking-tight"
        >
          <GradientText
            colors={['#818cf8', '#a78bfa', '#818cf8']}
            animationSpeed={8}
            className="text-6xl md:text-8xl lg:text-9xl font-bold"
          >
            Mirror Lab
          </GradientText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-2xl md:text-3xl text-muted-foreground font-light max-w-2xl mx-auto mb-12"
        >
          Build your own telescope from scratch
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-12"
        >
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums">
              <CountUp to={60} duration={2} />+
            </div>
            <div className="text-sm text-muted-foreground mt-1">Years of ATM</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums">
              <CountUp to={100} duration={2} />+
            </div>
            <div className="text-sm text-muted-foreground mt-1">Mirrors Completed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums">
              6&quot;&ndash;16&quot;
            </div>
            <div className="text-sm text-muted-foreground mt-1">Mirror Sizes</div>
          </div>
        </motion.div>
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
      className="relative rounded-2xl bg-card/50 p-8 hover:bg-card transition-colors duration-300"
    >
      <div className="text-5xl font-bold text-primary/20 mb-4 tabular-nums">
        {String(step).padStart(2, '0')}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative aspect-[3/2] rounded-xl overflow-hidden cursor-pointer"
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white text-sm font-medium">{image.caption}</p>
      </div>
    </motion.div>
  );
}
