/**
 * VSA (Very Small Array) Page
 *
 * Displays information about SPAC's smart telescope program,
 * current targets, and links to the Facebook group.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db/prisma';
import { Telescope, Target, ExternalLink, Facebook, Star, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'VSA - Very Small Array | SPAC',
  description: 'Learn about SPAC\'s Very Small Array smart telescope program, current observation targets, and how to get involved.',
};

async function getCurrentTargets() {
  const targets = await prisma.vSATarget.findMany({
    where: {
      isCurrentTarget: true,
    },
    orderBy: {
      startDate: 'desc',
    },
  });
  return targets;
}

async function getEquipment() {
  const equipment = await prisma.vSAEquipment.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  return equipment;
}

export default async function VSAPage() {
  const [targets, equipment] = await Promise.all([
    getCurrentTargets(),
    getEquipment(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full animate-pulse delay-100" />
          <div className="absolute top-40 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-200" />
          <div className="absolute top-60 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-300" />
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full mb-6">
              <Telescope className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-300 font-medium">Smart Telescope Program</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Very Small Array
              <span className="block text-3xl md:text-4xl text-indigo-400 mt-2">(VSA)</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              SPAC&apos;s smart telescope program makes deep-sky imaging accessible to everyone. 
              Our automated telescopes capture stunning images of celestial objects while you learn 
              about the wonders of the universe.
            </p>
          </div>
        </div>
      </div>

      {/* Current Targets Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Target className="w-6 h-6 text-amber-400" />
            <h2 className="text-3xl font-bold text-white">Current Targets</h2>
          </div>

          {targets.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {targets.map((target) => (
                <div
                  key={target.id}
                  className="group relative bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300"
                >
                  {target.imageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={target.imageUrl}
                        alt={target.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-white group-hover:text-indigo-400 transition-colors">
                        {target.name}
                      </h3>
                      {target.magnitude && (
                        <span className="flex items-center gap-1 text-sm text-amber-400">
                          <Star className="w-3 h-3" />
                          {target.magnitude.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-indigo-400 mb-2">{target.objectType}</p>
                    {target.constellation && (
                      <p className="text-sm text-slate-400 mb-3">in {target.constellation}</p>
                    )}
                    {target.description && (
                      <p className="text-slate-300 text-sm line-clamp-3">{target.description}</p>
                    )}
                    {(target.startDate || target.endDate) && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {target.startDate && new Date(target.startDate).toLocaleDateString()}
                          {target.endDate && ` - ${new Date(target.endDate).toLocaleDateString()}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
              <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No current targets. Check back soon for new observation targets!</p>
            </div>
          )}
        </div>
      </section>

      {/* Equipment Section */}
      {equipment.length > 0 && (
        <section className="py-16 bg-slate-800/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Telescope className="w-6 h-6 text-indigo-400" />
              <h2 className="text-3xl font-bold text-white">Our Equipment</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-indigo-500/50 transition-colors"
                >
                  {item.imageUrl && (
                    <div className="relative h-40 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
                  <p className="text-sm text-indigo-400 mb-3">{item.type}</p>
                  {item.description && (
                    <p className="text-slate-300 text-sm">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About & Join Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* About VSA */}
            <div className="bg-gradient-to-br from-slate-800/50 to-indigo-900/20 border border-slate-700/50 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">What is the VSA?</h2>
              <div className="space-y-4 text-slate-300">
                <p>
                  The Very Small Array (VSA) is SPAC&apos;s innovative program that brings the power of 
                  smart telescopes to our members. Using automated imaging systems, we capture detailed 
                  images of deep-sky objects, planets, and other celestial wonders.
                </p>
                <p>
                  Whether you&apos;re a seasoned astronomer or just starting your journey, the VSA provides 
                  an accessible way to explore the cosmos. Our smart telescopes handle the complex tracking 
                  and imaging, allowing you to focus on learning and discovery.
                </p>
                <p>
                  Members can participate in observing sessions, learn image processing techniques, 
                  and contribute to our growing collection of astronomical images.
                </p>
              </div>
            </div>

            {/* Join the Community */}
            <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-700/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Join Our Community</h2>
              <div className="space-y-4 text-slate-300 mb-6">
                <p>
                  Connect with fellow VSA enthusiasts on our Facebook group! Share your observations, 
                  ask questions, and stay updated on upcoming sessions and targets.
                </p>
                <p>
                  Our active community includes experienced astrophotographers who are always happy 
                  to help newcomers get started with smart telescope imaging.
                </p>
              </div>
              <a
                href="https://www.facebook.com/groups/spacvsa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
              >
                <Facebook className="w-5 h-5" />
                Join VSA Facebook Group
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Explore the Universe?</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            Join SPAC and get access to our VSA program, star parties, educational workshops, and more!
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
          >
            Become a Member
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
