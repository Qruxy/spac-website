/**
 * My Offers Page
 *
 * View and manage offers on your listings and offers you've made.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Inbox,
  Send,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Package,
  ExternalLink,
} from 'lucide-react';
import { OfferActions } from './offer-actions';

export const metadata: Metadata = {
  title: 'My Offers',
  description: 'View and manage your offers',
};

export default async function MyOffersPage() {
  const session = await getSession();

  // Parallel queries for better performance
  const [incomingOffers, sentOffers] = await prisma.$transaction([
    // Fetch offers where user is the seller (incoming)
    prisma.offer.findMany({
      where: { sellerId: session!.user.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            askingPrice: true,
            images: {
              take: 1,
              select: { url: true, thumbnailUrl: true },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Fetch offers where user is the buyer (sent)
    prisma.offer.findMany({
      where: { buyerId: session!.user.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            askingPrice: true,
            images: {
              take: 1,
              select: { url: true, thumbnailUrl: true },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const pendingIncoming = incomingOffers.filter(
    (o) => o.status === 'PENDING' || o.status === 'COUNTERED'
  );
  const pendingSent = sentOffers.filter(
    (o) => o.status === 'PENDING' || o.status === 'COUNTERED'
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Offers</h1>
        <p className="text-muted-foreground mt-1">
          Manage offers on your listings and track offers you&apos;ve made
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <StatCard
          title="Pending Received"
          value={pendingIncoming.length}
          icon={Inbox}
          color="text-yellow-400"
        />
        <StatCard
          title="Pending Sent"
          value={pendingSent.length}
          icon={Send}
          color="text-blue-400"
        />
        <StatCard
          title="Accepted"
          value={
            incomingOffers.filter((o) => o.status === 'ACCEPTED').length +
            sentOffers.filter((o) => o.status === 'ACCEPTED').length
          }
          icon={CheckCircle2}
          color="text-green-400"
        />
        <StatCard
          title="Total"
          value={incomingOffers.length + sentOffers.length}
          icon={DollarSign}
          color="text-purple-400"
        />
      </div>

      {/* Incoming Offers */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Incoming Offers ({incomingOffers.length})
          </h2>
        </div>

        {incomingOffers.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No offers received yet
            </h3>
            <p className="text-muted-foreground">
              When buyers make offers on your listings, they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                type="incoming"
                userRole="seller"
              />
            ))}
          </div>
        )}
      </section>

      {/* Sent Offers */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Sent Offers ({sentOffers.length})
          </h2>
        </div>

        {sentOffers.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No offers sent yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Browse classifieds and make offers on items you&apos;re interested in.
            </p>
            <Link
              href="/classifieds"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse Classifieds
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sentOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                type="sent"
                userRole="buyer"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: typeof Inbox;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{title}</p>
    </div>
  );
}

const statusConfig: Record<
  string,
  { icon: typeof Clock; color: string; label: string }
> = {
  PENDING: {
    icon: Clock,
    color: 'text-yellow-400 bg-yellow-500/10',
    label: 'Pending',
  },
  ACCEPTED: {
    icon: CheckCircle2,
    color: 'text-green-400 bg-green-500/10',
    label: 'Accepted',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-400 bg-red-500/10',
    label: 'Rejected',
  },
  COUNTERED: {
    icon: ArrowRightLeft,
    color: 'text-blue-400 bg-blue-500/10',
    label: 'Countered',
  },
  WITHDRAWN: {
    icon: XCircle,
    color: 'text-gray-400 bg-gray-500/10',
    label: 'Withdrawn',
  },
  EXPIRED: {
    icon: Clock,
    color: 'text-orange-400 bg-orange-500/10',
    label: 'Expired',
  },
};

interface OfferCardProps {
  offer: {
    id: string;
    amount: { toNumber(): number } | number;
    counterAmount: { toNumber(): number } | number | null;
    status: string;
    message: string | null;
    responseMessage: string | null;
    expiresAt: Date | null;
    createdAt: Date;
    listing: {
      id: string;
      title: string;
      slug: string;
      askingPrice: { toNumber(): number } | number;
      images: { url: string; thumbnailUrl: string | null }[];
    };
    buyer?: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
    seller?: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
  };
  type: 'incoming' | 'sent';
  userRole: 'buyer' | 'seller';
}

function OfferCard({ offer, type, userRole }: OfferCardProps) {
  const status = statusConfig[offer.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  const amount = typeof offer.amount === 'number' ? offer.amount : offer.amount.toNumber();
  const counterAmount = offer.counterAmount
    ? typeof offer.counterAmount === 'number'
      ? offer.counterAmount
      : offer.counterAmount.toNumber()
    : null;
  const askingPrice =
    typeof offer.listing.askingPrice === 'number'
      ? offer.listing.askingPrice
      : offer.listing.askingPrice.toNumber();

  const otherParty = type === 'incoming' ? offer.buyer : offer.seller;
  const otherPartyName = otherParty?.name ||
    `${otherParty?.firstName} ${otherParty?.lastName}`.trim() ||
    'Anonymous';

  const percentOff = Math.round(((askingPrice - amount) / askingPrice) * 100);

  const isActionable = offer.status === 'PENDING' || offer.status === 'COUNTERED';
  const isExpired = offer.expiresAt && new Date(offer.expiresAt) < new Date();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-32 h-24 sm:h-auto bg-muted flex-shrink-0">
          {offer.listing.images[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.listing.images[0].thumbnailUrl || offer.listing.images[0].url}
              alt={offer.listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
                {isExpired && offer.status === 'PENDING' && (
                  <span className="text-xs text-destructive">Expired</span>
                )}
              </div>
              <Link
                href={`/classifieds/${offer.listing.slug}`}
                className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {offer.listing.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {type === 'incoming' ? 'From' : 'To'}: {otherPartyName}
              </p>
            </div>

            <Link
              href={`/classifieds/${offer.listing.slug}`}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {/* Pricing */}
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {counterAmount ? 'Original Offer' : 'Offer'}
              </p>
              <p className="text-lg font-bold text-primary">
                ${amount.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({percentOff}% off)
                </span>
              </p>
            </div>
            {counterAmount && (
              <div>
                <p className="text-xs text-muted-foreground">Counter Offer</p>
                <p className="text-lg font-bold text-blue-400">
                  ${counterAmount.toLocaleString()}
                </p>
              </div>
            )}
            <div className="ml-auto">
              <p className="text-xs text-muted-foreground">Asking</p>
              <p className="text-sm text-muted-foreground">
                ${askingPrice.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Messages */}
          {offer.message && (
            <div className="mb-2 p-2 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Message: </span>
              {offer.message}
            </div>
          )}
          {offer.responseMessage && (
            <div className="mb-2 p-2 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Response: </span>
              {offer.responseMessage}
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span>
              Received {new Date(offer.createdAt).toLocaleDateString()}
            </span>
            {offer.expiresAt && !isExpired && isActionable && (
              <span>
                Expires {new Date(offer.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Actions */}
          {isActionable && !isExpired && (
            <OfferActions
              offerId={offer.id}
              userRole={userRole}
              status={offer.status}
              currentAmount={counterAmount || amount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
