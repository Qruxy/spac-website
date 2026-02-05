'use client';

/**
 * OBS Info Sections
 *
 * Event information sections for the OBS public page.
 * Includes schedule, location, what to bring, and FAQs.
 */

import { motion } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Tent, 
  Utensils, 
  Star, 
  Users,
  Moon,
  Telescope,
  Car,
  CheckCircle
} from 'lucide-react';
// Direct imports to avoid barrel export bundle bloat
import { FadeIn } from '@/components/animated/fade-in';
import { CountUp } from '@/components/animated/count-up';

interface OBSInfoProps {
  location: string;
  startDate: Date;
  endDate: Date;
}

export function OBSAboutSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            What is the{' '}
            <span className="text-amber-400">Orange Blossom Special?</span>
          </h2>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              The <strong className="text-amber-400">Orange Blossom Special (OBS)</strong> is 
              SPAC&apos;s premier annual star party, bringing together astronomers from across 
              Florida for a multi-day celestial celebration. Named after Florida&apos;s famous 
              orange blossoms, this event offers some of the darkest skies in the region.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              Whether you&apos;re a seasoned astrophotographer or just getting started with 
              your first telescope, OBS offers something for everyone — expert speakers, 
              equipment swap meets, guided observing sessions, and the camaraderie of 
              fellow stargazers under pristine night skies.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function OBSStatsSection() {
  const stats = [
    { value: 25, suffix: '+', label: 'Years Running' },
    { value: 200, suffix: '+', label: 'Attendees' },
    { value: 3, suffix: '', label: 'Days of Observing' },
    { value: 21, suffix: '', label: 'Mag Sky Darkness' },
  ];

  return (
    <section className="py-12 px-4 bg-slate-900/50">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={index * 0.1}>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-amber-400">
                  <CountUp to={stat.value} duration={2.5} delay={index * 0.15} />
                  {stat.suffix}
                </div>
                <div className="mt-2 text-sm text-slate-400">{stat.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OBSScheduleSection({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const formatDate = (date: Date) => 
    date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const schedule = [
    {
      day: 'Day 1',
      date: formatDate(startDate),
      events: [
        { time: '12:00 PM', title: 'Registration Opens', icon: Users },
        { time: '3:00 PM', title: 'Welcome & Orientation', icon: Star },
        { time: '5:00 PM', title: 'Dinner', icon: Utensils },
        { time: '7:00 PM', title: 'Opening Night Observing', icon: Telescope },
      ],
    },
    {
      day: 'Day 2',
      date: formatDate(new Date(startDate.getTime() + 86400000)),
      events: [
        { time: '8:00 AM', title: 'Breakfast', icon: Utensils },
        { time: '10:00 AM', title: 'Guest Speakers', icon: Users },
        { time: '2:00 PM', title: 'Equipment Swap Meet', icon: Telescope },
        { time: '5:00 PM', title: 'Dinner', icon: Utensils },
        { time: '7:00 PM', title: 'Prime Observing Session', icon: Moon },
      ],
    },
    {
      day: 'Day 3',
      date: formatDate(endDate),
      events: [
        { time: '8:00 AM', title: 'Breakfast', icon: Utensils },
        { time: '10:00 AM', title: 'Astrophotography Showcase', icon: Star },
        { time: '12:00 PM', title: 'Closing Remarks', icon: Users },
      ],
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl font-bold text-white mb-2 text-center">
            <Calendar className="inline-block w-8 h-8 text-amber-400 mr-2 mb-1" />
            Event Schedule
          </h2>
          <p className="text-slate-400 text-center mb-10">
            Three days of stellar experiences await you
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {schedule.map((day, dayIndex) => (
            <FadeIn key={day.day} delay={dayIndex * 0.15}>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4">
                  <h3 className="text-xl font-bold text-white">{day.day}</h3>
                  <p className="text-amber-100 text-sm">{day.date}</p>
                </div>
                <div className="p-4 space-y-3">
                  {day.events.map((event, eventIndex) => (
                    <motion.div
                      key={event.title}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: dayIndex * 0.1 + eventIndex * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <event.icon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-amber-400 font-medium">{event.time}</span>
                        <p className="text-sm text-slate-300">{event.title}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OBSLocationSection({ location }: { location: string }) {
  return (
    <section className="py-16 px-4 bg-slate-900/50">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl font-bold text-white mb-2 text-center">
            <MapPin className="inline-block w-8 h-8 text-amber-400 mr-2 mb-1" />
            Location
          </h2>
          <p className="text-slate-400 text-center mb-10">{location}</p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-8">
          <FadeIn delay={0.1}>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Getting There</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Car className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-slate-300 font-medium">By Car</p>
                    <p className="text-sm text-slate-400">
                      Located approximately 1 hour north of Tampa. GPS coordinates 
                      and detailed directions will be emailed after registration.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tent className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-slate-300 font-medium">Camping</p>
                    <p className="text-sm text-slate-400">
                      Both tent and RV camping available. Primitive camping with 
                      some electrical hookups. Restroom facilities on-site.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden h-64 md:h-auto">
              {/* Placeholder for map - in production would embed Google Maps */}
              <div className="w-full h-full bg-slate-700/50 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                  <p className="text-slate-400">Map available after registration</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

export function OBSWhatToBringSection() {
  const items = [
    { category: 'Essential', items: ['Telescope/Binoculars', 'Red flashlight', 'Warm clothing (layers!)', 'Camping gear if staying overnight'] },
    { category: 'Recommended', items: ['Star charts/Planisphere', 'Extra batteries', 'Laptop/tablet for imaging', 'Folding chair/lounger'] },
    { category: 'Nice to Have', items: ['Camera for astrophotography', 'Eyepiece collection', 'Power station/battery', 'Snacks & beverages'] },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl font-bold text-white mb-2 text-center">
            <CheckCircle className="inline-block w-8 h-8 text-amber-400 mr-2 mb-1" />
            What to Bring
          </h2>
          <p className="text-slate-400 text-center mb-10">
            Be prepared for the best observing experience
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((category, index) => (
            <FadeIn key={category.category} delay={index * 0.1}>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">{category.category}</h3>
                <ul className="space-y-2">
                  {category.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OBSInfoSections({ location, startDate, endDate }: OBSInfoProps) {
  return (
    <>
      <OBSAboutSection />
      <OBSStatsSection />
      <OBSScheduleSection startDate={startDate} endDate={endDate} />
      <OBSLocationSection location={location} />
      <OBSWhatToBringSection />
    </>
  );
}

export default OBSInfoSections;
