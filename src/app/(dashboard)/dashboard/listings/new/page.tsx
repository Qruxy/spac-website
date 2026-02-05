/**
 * New Listing Page
 *
 * Create a new classified listing.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { ListingForm } from '@/components/features/listing-form';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Create Listing',
  description: 'Create a new classified listing',
};

export default async function NewListingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/listings/new');
  }

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
        <h1 className="text-3xl font-bold text-foreground">Create Listing</h1>
        <p className="text-muted-foreground mt-1">
          List your astronomy equipment for sale to fellow club members
        </p>
      </div>

      <ListingForm mode="create" />
    </div>
  );
}
