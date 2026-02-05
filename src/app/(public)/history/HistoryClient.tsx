'use client';

/**
 * History Page Client Components
 *
 * Interactive and animated components for the History page.
 */

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'motion/react';
// Direct imports to avoid barrel export bundle bloat
import { GradientText } from '@/components/animated/gradient-text';
import { CountUp } from '@/components/animated/count-up';
import { TiltedCard } from '@/components/animated/tilted-card';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export function HistoryHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-amber-950/30 to-background">
      {/* Animated stars */}
      <div className="absolute inset-0">
        {[...Array(80)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Vintage overlay effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/30 rounded-full mb-8">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300 font-medium">Founded 1927</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-6"
        >
          <div className="text-6xl md:text-8xl font-bold text-white mb-2">
            <CountUp to={97} duration={2.5} />
          </div>
          <div className="text-2xl md:text-3xl text-slate-300">Years of Stargazing</div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-4xl md:text-6xl font-bold mb-6"
        >
          <GradientText
            colors={['#fcd34d', '#f59e0b', '#d97706', '#fcd34d']}
            animationSpeed={8}
            className="text-4xl md:text-6xl font-bold"
          >
            Our History
          </GradientText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-xl text-slate-300 max-w-2xl mx-auto"
        >
          From a handful of astronomy enthusiasts to one of Florida&apos;s largest clubs,
          our story spans nearly a century.
        </motion.p>
      </div>
    </section>
  );
}

interface Milestone {
  year: string;
  title: string;
  description: string;
  image?: string;
  highlight?: boolean;
}

interface TimelineProps {
  milestones: Milestone[];
}

export function Timeline({ milestones }: TimelineProps) {
  return (
    <div className="relative">
      {/* Center line */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-1/2" />

      <div className="space-y-12">
        {milestones.map((milestone, index) => (
          <TimelineItem
            key={milestone.year}
            milestone={milestone}
            index={index}
            isEven={index % 2 === 0}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  milestone,
  index,
  isEven,
}: {
  milestone: Milestone;
  index: number;
  isEven: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isEven ? -50 : 50 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={`relative flex items-start gap-4 md:gap-8 ${
        isEven ? 'md:flex-row' : 'md:flex-row-reverse'
      }`}
    >
      {/* Timeline dot */}
      <div
        className={`absolute left-4 md:left-1/2 w-4 h-4 rounded-full border-4 border-background md:-translate-x-1/2 z-10 ${
          milestone.highlight ? 'bg-primary' : 'bg-muted-foreground'
        }`}
      />

      {/* Content */}
      <div
        className={`ml-12 md:ml-0 md:w-1/2 ${
          isEven ? 'md:pr-12 md:text-right' : 'md:pl-12'
        }`}
      >
        <div
          className={`bg-card border rounded-xl p-6 hover:border-primary/50 transition-colors ${
            milestone.highlight ? 'border-primary/30' : 'border-border'
          }`}
        >
          {/* Year badge */}
          <div
            className={`inline-block rounded-full px-4 py-1 text-sm font-bold mb-3 ${
              milestone.highlight
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {milestone.year}
          </div>

          <h3 className="text-xl font-semibold text-foreground mb-2">
            {milestone.title}
          </h3>
          <p className="text-muted-foreground mb-4">{milestone.description}</p>

          {milestone.image && (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <Image
                src={milestone.image}
                alt={milestone.title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface NotableMember {
  name: string;
  role: string;
  description: string;
  image: string;
}

interface NotableMembersSectionProps {
  members: NotableMember[];
}

export function NotableMembersSection({ members }: NotableMembersSectionProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {members.map((member, index) => (
        <MemberCard key={member.name} member={member} index={index} />
      ))}
    </div>
  );
}

function MemberCard({ member, index }: { member: NotableMember; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <TiltedCard
        imageSrc={member.image}
        altText={member.name}
        containerHeight="250px"
        imageHeight="200px"
        imageWidth="200px"
        rotateAmplitude={10}
        scaleOnHover={1.05}
        showTooltip={false}
      />
      <div className="mt-4 text-center">
        <h3 className="font-semibold text-foreground">{member.name}</h3>
        <p className="text-sm text-primary">{member.role}</p>
        <p className="text-sm text-muted-foreground mt-2">{member.description}</p>
      </div>
    </motion.div>
  );
}

interface HistoricalPhoto {
  src: string;
  caption: string;
  era: 'Then' | 'Now';
}

interface HistoricalPhotosProps {
  photos: HistoricalPhoto[];
}

export function HistoricalPhotos({ photos }: HistoricalPhotosProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 2 : prev - 2));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= photos.length - 2 ? 0 : prev + 2));
  };

  // Group photos into pairs (Then & Now)
  const currentPhotos = photos.slice(currentIndex, currentIndex + 2);

  return (
    <div className="relative">
      <div className="grid md:grid-cols-2 gap-6">
        {currentPhotos.map((photo, index) => (
          <motion.div
            key={`${currentIndex}-${index}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <div className="absolute top-4 left-4 z-10">
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  photo.era === 'Then'
                    ? 'bg-amber-500/80 text-amber-950'
                    : 'bg-blue-500/80 text-blue-950'
                }`}
              >
                {photo.era}
              </span>
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border">
              <Image
                src={photo.src}
                alt={photo.caption}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-sm">{photo.caption}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          onClick={handlePrev}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          aria-label="Previous photos"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-2">
          {Array.from({ length: Math.ceil(photos.length / 2) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i * 2)}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(currentIndex / 2) === i
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30'
              }`}
              aria-label={`Go to photo pair ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          aria-label="Next photos"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
