/**
 * General Meetings Page
 *
 * Information about SPAC monthly general meetings and past presentations.
 * All schedule details, location, contact info, and presentations are
 * editable via Admin > Page Builder.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { MapPin, Clock, Calendar, Mail, Video, FileText, ExternalLink, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'General Meetings | SPAC',
  description:
    'SPAC general meetings are held monthly. Free and open to the public. Past presentations available for download.',
};

const GradientText = nextDynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);
const FadeIn = nextDynamic(
  () => import('@/components/animated/fade-in').then((mod) => mod.FadeIn),
  { ssr: false }
);

export default async function GeneralMeetingsPage() {
  // All content is editable via Admin > Page Builder
  const contentRows = await prisma.siteContent.findMany({
    where: { pageKey: 'general-meetings' },
  });
  const content: Record<string, string> = {};
  for (const row of contentRows) content[row.fieldKey] = row.value;

  // Page header
  const heroSubtitle = content['hero_subtitle'] ||
    'Join fellow astronomers for presentations, discussions, and club news. Free and open to the public.';

  // Schedule fields — all editable in Page Builder
  const meetingDay       = content['meeting_day']             || 'Fourth Thursday of each month (except November and December, when meetings are held on the third Thursday)';
  const meetingTime      = content['meeting_time']            || '7:30 PM';
  const locationName     = content['meeting_location_name']   || 'St. Petersburg College — Gibbs Campus';
  const locationAddress  = content['meeting_location_address']|| '6605 5th Ave North, Saint Petersburg, FL 33710';
  const meetingRoom      = content['meeting_room']            || 'Natural Sciences Building, Room SC236';
  const openToPublic     = content['open_to_public_note']     || 'Meetings are free and open to the public. Everyone is welcome!';
  const socialRoom       = content['social_room']             || 'Philip Benjamin Social Arts Building, Room SA114';
  const contactName      = content['contact_name']            || 'Peter McLean';
  const contactEmail     = content['contact_email']           || 'Info@StPeteAstronomyClub.org';

  // Rich body content and past presentations — both editable in Page Builder
  const body = content['body'];
  const pastPresentationsHtml = content['past_presentations'];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight mb-6">
                General{' '}
                <GradientText
                  colors={['#818cf8', '#a78bfa', '#818cf8']}
                  className="text-5xl md:text-7xl font-bold"
                  animationSpeed={8}
                >
                  Meetings
                </GradientText>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {heroSubtitle}
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Page Builder Body Content — edited via Admin > Page Builder */}
      {body && (
        <section className="pb-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div
              className="prose prose-invert max-w-none rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-10
                         prose-headings:text-foreground prose-p:text-muted-foreground
                         prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
        </section>
      )}

      {/* Meeting Schedule — all values editable via Admin > Page Builder */}
      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-10 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Meeting Schedule</h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{meetingDay}</p>
                  </div>

                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">{meetingTime}</span>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-muted-foreground">
                      <p className="text-foreground font-medium">{locationName}</p>
                      {locationAddress && <p>{locationAddress}</p>}
                      {meetingRoom && (
                        <p className="mt-1">
                          <span className="text-foreground font-medium">Room:</span> {meetingRoom}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-6">
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">Open to All</p>
                  <p className="text-sm text-muted-foreground">{openToPublic}</p>
                </div>
                {socialRoom && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Parties &amp; Picnics
                    </p>
                    <p className="text-sm text-muted-foreground">{socialRoom}</p>
                  </div>
                )}
              </div>

              {/* Contact + CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t border-border pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  {contactName && <span>Questions? Contact {contactName} at</span>}
                  {!contactName && <span>Questions? Contact us at</span>}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-primary hover:underline"
                  >
                    {contactEmail}
                  </a>
                </div>
                <Link
                  href="/register"
                  className="ml-auto flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Join SPAC
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Past Presentations — editable via Admin > Page Builder */}
      <section className="pb-24 bg-muted/10">
        <div className="container mx-auto px-4 max-w-5xl py-16">
          <FadeIn delay={0.15}>
            <h2 className="text-3xl font-bold text-foreground mb-8">Past Presentations</h2>

            {pastPresentationsHtml ? (
              /* Admin-managed presentations list */
              <div
                className="prose prose-invert max-w-none
                           prose-headings:text-foreground prose-p:text-muted-foreground
                           prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground
                           prose-table:w-full prose-td:px-4 prose-td:py-2 prose-th:px-4 prose-th:py-2"
                dangerouslySetInnerHTML={{ __html: pastPresentationsHtml }}
              />
            ) : (
              /* Fallback: static table (edit "Past Presentations Content" in Page Builder to replace) */
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Presentation</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Video</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { date: 'July 24, 2025', title: 'Using Your Dwarf', videoUrl: 'https://drive.google.com/file/d/1e3UN_BzImiL1fzy3dGdVgYeqRD1llLr8/view?usp=drive_link', pdfUrl: 'https://drive.google.com/file/d/16e3CuvW0s0o6aJPdN3gd1-8ASICTFCRF/view?usp=drive_link' },
                      { date: 'May 22, 2025', title: 'Europa Clipper Mission', videoUrl: 'https://drive.google.com/file/d/12Sh4qAi6Rr0s1HFl-K_IlGryNi0Kddk6/view?usp=drive_link', pdfUrl: null },
                      { date: 'April 24, 2025', title: 'Understanding Tropical Weather', videoUrl: 'https://drive.google.com/file/d/1aVeYyoThMoFXhr_eTEKUDMIKsCWnMWFr/view?usp=drive_link', pdfUrl: 'https://drive.google.com/file/d/1WWcKXY8oQVbgILT9YIvOEiHW5GAeUQKj/view?usp=drive_link' },
                      { date: 'February 27, 2025', title: 'Dwarf Labs Presentation', videoUrl: 'https://drive.google.com/file/d/1ish03zB-j9GxHLH79XLDaSTLzBSTKa0z/view?usp=drive_link', pdfUrl: 'https://drive.google.com/file/d/1T9-i2xdF0uf91HJNxGz2bLVBI9s-omrO/view?usp=drive_link' },
                      { date: 'January 23, 2025', title: 'Solar Imaging By Conrad Cornado', videoUrl: 'https://drive.google.com/file/d/1ZlABezjM4coiW_GRLjIav6c6bhGUWlNj/view?usp=drive_link', pdfUrl: 'https://drive.google.com/file/d/1SjR6Grmj9Sk6O37bqOfR2S9qhRZr0FT5/view?usp=drive_link' },
                      { date: 'November 21, 2024', title: 'The Smart Scope Revolution: Introducing the Seestar S50', videoUrl: null, pdfUrl: 'https://drive.google.com/drive/u/2/folders/1tjtQyr8SFtffYltmLDl0bZ63NZsH6ke2' },
                      { date: 'August 22, 2024', title: 'Mars and the Outer Planets 2024-25', videoUrl: 'https://drive.google.com/drive/u/2/folders/1tjtQyr8SFtffYltmLDl0bZ63NZsH6ke2', pdfUrl: 'https://drive.google.com/drive/u/2/folders/1tjtQyr8SFtffYltmLDl0bZ63NZsH6ke2' },
                      { date: 'July 25, 2024', title: "The Historical and Astronomical Significance of Caesar's Calendar", videoUrl: null, pdfUrl: 'https://drive.google.com/file/d/1yA0M5eYH1a0nmYHetFv6gZe8jcn7SADC/view?usp=sharing' },
                      { date: 'June 27, 2024', title: 'Lens, Light and Telescope', videoUrl: 'https://drive.google.com/file/d/13AfakZh0XpS_bSz4f7ISM22fTDFtc9KD/view?usp=drive_link', pdfUrl: 'https://drive.google.com/file/d/1L-MBm6WYtH82-6yLQVbGmb7aJGKZ3Acm/view?usp=drive_link' },
                    ].map((p, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{p.date}</td>
                        <td className="px-4 py-3 text-foreground font-medium">{p.title}</td>
                        <td className="px-4 py-3 text-center">
                          {p.videoUrl ? (
                            <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium">
                              <Video className="h-3.5 w-3.5" />Watch<ExternalLink className="h-3 w-3" />
                            </a>
                          ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.pdfUrl ? (
                            <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium">
                              <FileText className="h-3.5 w-3.5" />PDF<ExternalLink className="h-3 w-3" />
                            </a>
                          ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground/40 p-4 italic">
                  To update this presentations list, go to Admin → Page Builder → General Meetings → &quot;Past Presentations Content&quot;.
                </p>
              </div>
            )}
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
