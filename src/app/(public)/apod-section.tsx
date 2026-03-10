/**
 * APOD Section — Astronomy Picture of the Day
 *
 * Server component. Fetches NASA APOD API with 24h ISR revalidation.
 * Displays image, title, date, copyright, and explanation.
 */

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Rocket } from 'lucide-react';
import { APODReadMore } from './apod-read-more';

export const revalidate = 86400;

interface APODData {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: 'image' | 'video';
  date: string;
  copyright?: string;
}

async function fetchAPOD(): Promise<APODData | null> {
  try {
    const apiKey = process.env.APOD_API_KEY || 'DEMO_KEY';
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      console.error('[APOD] API error:', res.status, res.statusText);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('[APOD] Fetch failed:', err);
    return null;
  }
}

/** Attempt to convert a YouTube page URL to an embed URL */
function toYouTubeEmbed(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  // Already an embed URL?
  if (url.includes('youtube.com/embed/')) return url;
  return null;
}

export async function APODSection() {
  const apod = await fetchAPOD();
  if (!apod) return null;

  const formattedDate = new Date(apod.date + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="py-20 bg-slate-950/50 border-y border-border/30">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-6">
          <Rocket className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            Astronomy Picture of the Day
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 items-center">
          {/* Media */}
          <div className="relative rounded-xl overflow-hidden border border-border/40 shadow-2xl shadow-black/40 bg-black">
            {apod.media_type === 'video' ? (
              (() => {
                const embedUrl = toYouTubeEmbed(apod.url);
                return embedUrl ? (
                  <div className="aspect-video">
                    <iframe
                      src={embedUrl}
                      title={apod.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-slate-900">
                    <a
                      href={apod.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                      Watch Video
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                );
              })()
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={apod.hdurl || apod.url}
                alt={apod.title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            )}
          </div>

          {/* Text content */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-1">
                {apod.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{formattedDate}</span>
                {apod.copyright && (
                  <>
                    <span className="text-border">·</span>
                    <span>© {apod.copyright.trim()}</span>
                  </>
                )}
              </div>
            </div>

            <APODReadMore text={apod.explanation} />

            {/* NASA Badge */}
            <div className="pt-2">
              <Link
                href="https://apod.nasa.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors border border-border/40 rounded-full px-3 py-1.5 hover:border-primary/40"
              >
                <Rocket className="h-3 w-3" />
                Powered by NASA APOD
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
