/**
 * Edit Listing Page
 *
 * Edit an existing classified listing.
 */

import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ListingForm } from '@/components/features/listing-form';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Edit Listing',
  description: 'Edit your classified listing',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: PageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: {
        where: { status: 'APPROVED' },
        select: {
          id: true,
          url: true,
          thumbnailUrl: true,
        },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  // Check ownership
  const isOwner = session.user.id === listing.sellerId;
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR';

  if (!isOwner && !isAdmin) {
    redirect('/my-listings');
  }

  // Can't edit sold or removed listings
  if (listing.status === 'SOLD' || listing.status === 'REMOVED') {
    redirect('/my-listings');
  }

  // Convert Decimal to string for the form
  const initialData = {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    condition: listing.condition,
    askingPrice: listing.price.toString(),
    acceptsOffers: listing.is_negotiable,
    minimumOffer: listing.minimumOffer?.toString() || '',
    brand: listing.brand || '',
    model: listing.model || '',
    yearMade: listing.yearMade?.toString() || '',
    originalPrice: listing.originalPrice?.toString() || '',
    location: listing.location || '',
    shippingAvailable: listing.shippingAvailable,
    localPickupOnly: listing.localPickupOnly,
    images: listing.images,
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/my-listings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Listings
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Edit Listing</h1>
        <p className="text-muted-foreground mt-1">
          Update your listing details
        </p>
      </div>

      <ListingForm mode="edit" initialData={initialData} />
    </div>
  );
}
