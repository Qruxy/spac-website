/**
 * Gallery Photo Submission Page
 *
 * Allows members to submit photos to the gallery for approval.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Camera, Info } from 'lucide-react';
import { GallerySubmitForm } from './gallery-submit-form';

export const metadata: Metadata = {
  title: 'Submit Photo',
  description: 'Submit your astrophotography to the SPAC gallery',
};

export default function GallerySubmitPage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Gallery
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Camera className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Submit Photo</h1>
        </div>
        <p className="text-muted-foreground">
          Share your astrophotography with the SPAC community
        </p>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 mb-8">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-400 mb-1">Submission Guidelines</p>
            <ul className="text-muted-foreground space-y-1">
              <li>Photos must be your own original work</li>
              <li>Maximum file size: 10MB (JPG, PNG, or WebP)</li>
              <li>Provide a descriptive caption for best results</li>
              <li>Photos are reviewed before appearing in the gallery</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <GallerySubmitForm />
    </div>
  );
}
