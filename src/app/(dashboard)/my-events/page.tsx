/**
 * My Events Page
 *
 * Shows user's event registrations - upcoming and past.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Events',
  description: 'View your event registrations',
};

export default async function MyEventsPage() {
  const session = await getSession();

  const registrations = await prisma.registration.findMany({
    where: { userId: session!.user.id },
    include: {
      event: true,
    },
    orderBy: {
      event: {
        startDate: 'asc',
      },
    },
  });

  const now = new Date();
  const upcomingRegistrations = registrations.filter(
    (r) => new Date(r.event.startDate) >= now && r.status !== 'CANCELLED'
  );
  const pastRegistrations = registrations.filter(
    (r) => new Date(r.event.startDate) < now || r.status === 'CANCELLED'
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Events</h1>
          <p className="text-muted-foreground mt-1">
            Your event registrations and attendance history
          </p>
        </div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Browse Events
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Upcoming Events */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Upcoming Events ({upcomingRegistrations.length})
        </h2>

        {upcomingRegistrations.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No upcoming events
            </h3>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t registered for any upcoming events yet.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Browse available events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingRegistrations.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                showCheckIn
              />
            ))}
          </div>
        )}
      </section>

      {/* Past Events */}
      {pastRegistrations.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Past Events ({pastRegistrations.length})
          </h2>
          <div className="space-y-4">
            {pastRegistrations.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                isPast
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RegistrationCard({
  registration,
  showCheckIn,
  isPast,
}: {
  registration: {
    id: string;
    status: string;
    checkedInAt: Date | null;
    event: {
      id: string;
      title: string;
      slug: string;
      startDate: Date;
      endDate: Date;
      locationName: string;
      type: string;
    };
  };
  showCheckIn?: boolean;
  isPast?: boolean;
}) {
  const statusConfig: Record<
    string,
    { icon: typeof CheckCircle2; color: string; label: string }
  > = {
    CONFIRMED: {
      icon: CheckCircle2,
      color: 'text-green-400 bg-green-500/10',
      label: 'Confirmed',
    },
    PENDING: {
      icon: AlertCircle,
      color: 'text-yellow-400 bg-yellow-500/10',
      label: 'Pending',
    },
    CANCELLED: {
      icon: XCircle,
      color: 'text-red-400 bg-red-500/10',
      label: 'Cancelled',
    },
    WAITLISTED: {
      icon: Clock,
      color: 'text-orange-400 bg-orange-500/10',
      label: 'Waitlisted',
    },
  };

  const status = statusConfig[registration.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <div
      className={`rounded-xl border border-border bg-card overflow-hidden ${
        isPast ? 'opacity-75' : ''
      }`}
    >
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
              >
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
              {registration.checkedInAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                  <QrCode className="h-3 w-3" />
                  Checked In
                </span>
              )}
            </div>

            <Link
              href={`/events/${registration.event.slug}`}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
            >
              {registration.event.title}
            </Link>

            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(registration.event.startDate).toLocaleDateString(
                  'en-US',
                  {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(registration.event.startDate).toLocaleTimeString(
                  'en-US',
                  {
                    hour: 'numeric',
                    minute: '2-digit',
                  }
                )}
              </div>
              {registration.event.locationName && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {registration.event.locationName}
                </div>
              )}
            </div>
          </div>

          {showCheckIn && registration.status === 'CONFIRMED' && (
            <div className="flex flex-col gap-2">
              <Link
                href={`/events/${registration.event.slug}`}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors text-center"
              >
                View Event
              </Link>
              {/* QR Code for check-in would go here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
