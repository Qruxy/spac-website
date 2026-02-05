/**
 * Mirror Lab Page
 *
 * Information about SPAC's telescope mirror grinding workshop.
 * A unique hands-on astronomy experience.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Wrench,
  Clock,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Telescope,
  Eye,
} from 'lucide-react';
import { MirrorLabHero, MirrorLabGallery, ProcessStep } from './MirrorLabClient';

export const metadata: Metadata = {
  title: 'Mirror Lab | SPAC',
  description:
    'Learn to grind, polish, and figure your own telescope mirror at SPAC\'s Mirror Lab workshop. Build your telescope from scratch!',
};

const learningTopics = [
  {
    title: 'Rough Grinding',
    description: 'Shape raw glass into a parabolic curve using progressively finer abrasives.',
    icon: Wrench,
  },
  {
    title: 'Fine Grinding & Polishing',
    description: 'Achieve optical-quality smoothness with cerium oxide and pitch laps.',
    icon: Sparkles,
  },
  {
    title: 'Figuring & Testing',
    description: 'Perfect your mirror using Foucault and Ronchi tests to achieve precision.',
    icon: Eye,
  },
  {
    title: 'Mirror Cell Design',
    description: 'Learn to build proper mirror supports for optimal performance.',
    icon: CheckCircle,
  },
  {
    title: 'Telescope Construction',
    description: 'Assemble your completed mirror into a working telescope.',
    icon: Telescope,
  },
];

const processSteps = [
  {
    step: 1,
    title: 'Start with Raw Glass',
    description:
      'Begin with a glass blank - typically Pyrex for thermal stability. Common sizes range from 6" to 12" diameter.',
  },
  {
    step: 2,
    title: 'Rough Grind the Curve',
    description:
      'Using silicon carbide grits, create the parabolic curve. This is satisfyingly physical work as you shape the glass.',
  },
  {
    step: 3,
    title: 'Fine Grinding',
    description:
      'Progress through finer and finer grits (120, 220, 320, 500) to smooth out the surface while maintaining the curve.',
  },
  {
    step: 4,
    title: 'Polishing',
    description:
      'Switch to a pitch lap with cerium oxide. The surface becomes optically smooth - you can see your reflection!',
  },
  {
    step: 5,
    title: 'Figuring',
    description:
      'The most delicate phase. Fine-tune the parabola using controlled polishing strokes guided by optical testing.',
  },
  {
    step: 6,
    title: 'Coating',
    description:
      'Once figured, your mirror is sent out for professional aluminum coating - then it\'s ready for first light!',
  },
];

const galleryImages = [
  {
    src: 'https://picsum.photos/seed/mirror1/600/400',
    alt: 'Mirror grinding in progress',
    caption: 'Rough grinding a 10" mirror blank',
  },
  {
    src: 'https://picsum.photos/seed/mirror2/600/400',
    alt: 'Foucault test setup',
    caption: 'Foucault knife-edge test in action',
  },
  {
    src: 'https://picsum.photos/seed/mirror3/600/400',
    alt: 'Completed mirror',
    caption: 'A freshly coated 8" primary mirror',
  },
  {
    src: 'https://picsum.photos/seed/mirror4/600/400',
    alt: 'Workshop environment',
    caption: 'Our well-equipped mirror grinding workshop',
  },
  {
    src: 'https://picsum.photos/seed/mirror5/600/400',
    alt: 'Completed telescope',
    caption: 'Member-built Dobsonian telescope',
  },
  {
    src: 'https://picsum.photos/seed/mirror6/600/400',
    alt: 'Polishing session',
    caption: 'Fine polishing with pitch lap',
  },
];

export default function MirrorLabPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <MirrorLabHero />

      {/* What is Mirror Grinding Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-primary mb-4">
                <Wrench className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wider">
                  The Art & Science
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                What is Mirror Grinding?
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-lg">
                  Mirror grinding is the art of transforming a flat disk of glass into a
                  precision optical surface capable of revealing the wonders of the universe.
                  It&apos;s a tradition dating back to the 1920s when amateur astronomers first
                  discovered they could make their own telescope mirrors.
                </p>
                <p>
                  Using nothing more than two pieces of glass, water, and abrasive compounds,
                  you can create a parabolic mirror accurate to within a fraction of a wavelength
                  of light. The process is meditative, rewarding, and connects you to a proud
                  tradition of amateur telescope making.
                </p>
                <p>
                  A hand-made mirror isn&apos;t just functional—it&apos;s a work of art. There&apos;s
                  something profoundly satisfying about observing the cosmos through optics
                  you crafted with your own hands.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden border border-border">
                <Image
                  src="https://picsum.photos/seed/mirrorhero/800/800"
                  alt="Mirror grinding process"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground rounded-xl p-6 shadow-xl">
                <div className="text-3xl font-bold">60+</div>
                <div className="text-sm">Years of ATM</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Process - Interactive Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              From Glass to Stars
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The journey from a blank piece of glass to your first view through your
              own telescope is unforgettable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map((step, index) => (
              <ProcessStep
                key={step.step}
                step={step.step}
                title={step.title}
                description={step.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What You&apos;ll Learn
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Master the complete process of telescope mirror making with guidance
              from experienced mentors.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {learningTopics.map((topic) => (
              <div
                key={topic.title}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <topic.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {topic.title}
                </h3>
                <p className="text-muted-foreground">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Info */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Workshop Information
              </h2>
              <p className="text-xl text-muted-foreground">
                Join us at the Mirror Lab and start your telescope-making journey.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Location</h3>
                </div>
                <p className="text-muted-foreground">
                  Mirror Lab Building<br />
                  St. Petersburg, FL<br />
                  <span className="text-sm italic">
                    (Address provided to registered members)
                  </span>
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Schedule</h3>
                </div>
                <p className="text-muted-foreground">
                  <strong>Saturdays:</strong> 9:00 AM - 1:00 PM<br />
                  <span className="text-sm">
                    Additional sessions may be scheduled for active projects
                  </span>
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">What to Bring</h3>
                </div>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Comfortable clothes (you will get wet)</li>
                  <li>• Closed-toe shoes</li>
                  <li>• Enthusiasm and patience</li>
                  <li>• Notebook for notes</li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Cost</h3>
                </div>
                <p className="text-muted-foreground">
                  <strong>Instruction:</strong> Free for SPAC members<br />
                  <strong>Materials:</strong> ~$50-200 depending on mirror size<br />
                  <span className="text-sm">
                    Glass blanks, abrasives, and pitch included
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Mirror Lab Gallery
            </h2>
            <p className="text-xl text-muted-foreground">
              See the magic happen at our workshop.
            </p>
          </div>

          <MirrorLabGallery images={galleryImages} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Build Your Own Telescope?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join SPAC and start your mirror-making journey. Our experienced mentors
            are ready to guide you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
            >
              Join the Club
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/about#board"
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-8 py-4 text-lg font-semibold text-foreground transition-all hover:bg-muted"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
