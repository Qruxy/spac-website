/**
 * Listing Form Component
 *
 * Reusable form for creating and editing classified listings.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';

interface ListingFormData {
  title: string;
  description: string;
  category: string;
  condition: string;
  askingPrice: string;
  acceptsOffers: boolean;
  minimumOffer: string;
  brand: string;
  model: string;
  yearMade: string;
  originalPrice: string;
  location: string;
  shippingAvailable: boolean;
  localPickupOnly: boolean;
}

interface ExistingImage {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
}

interface ListingFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<ListingFormData & { id: string; slug: string; images: ExistingImage[] }>;
}

const CATEGORIES = [
  { value: 'TELESCOPE', label: 'Telescopes' },
  { value: 'MOUNT', label: 'Mounts' },
  { value: 'EYEPIECE', label: 'Eyepieces' },
  { value: 'CAMERA', label: 'Cameras & Imaging' },
  { value: 'FINDER', label: 'Finders & Guides' },
  { value: 'FOCUSER', label: 'Focusers' },
  { value: 'ACCESSORY', label: 'Accessories' },
  { value: 'BINOCULAR', label: 'Binoculars' },
  { value: 'SOLAR', label: 'Solar Equipment' },
  { value: 'BOOK', label: 'Books & Media' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'OTHER', label: 'Other' },
];

const CONDITIONS = [
  { value: 'NEW', label: 'New', description: 'Unused, in original packaging' },
  { value: 'LIKE_NEW', label: 'Like New', description: 'Barely used, perfect condition' },
  { value: 'EXCELLENT', label: 'Excellent', description: 'Minor signs of use, works perfectly' },
  { value: 'GOOD', label: 'Good', description: 'Normal wear, fully functional' },
  { value: 'FAIR', label: 'Fair', description: 'Visible wear, works with limitations' },
  { value: 'FOR_PARTS', label: 'For Parts', description: 'Not fully functional, for parts/repair' },
];

export function ListingForm({ mode, initialData }: ListingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(initialData?.images || []);

  const [formData, setFormData] = useState<ListingFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    condition: initialData?.condition || '',
    askingPrice: initialData?.askingPrice || '',
    acceptsOffers: initialData?.acceptsOffers ?? true,
    minimumOffer: initialData?.minimumOffer || '',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    yearMade: initialData?.yearMade || '',
    originalPrice: initialData?.originalPrice || '',
    location: initialData?.location || '',
    shippingAvailable: initialData?.shippingAvailable ?? false,
    localPickupOnly: initialData?.localPickupOnly ?? true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleRemoveImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        askingPrice: parseFloat(formData.askingPrice),
        acceptsOffers: formData.acceptsOffers,
        minimumOffer: formData.minimumOffer ? parseFloat(formData.minimumOffer) : null,
        brand: formData.brand || null,
        model: formData.model || null,
        yearMade: formData.yearMade ? parseInt(formData.yearMade) : null,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        location: formData.location || null,
        shippingAvailable: formData.shippingAvailable,
        localPickupOnly: formData.localPickupOnly,
        status: asDraft ? 'DRAFT' : 'PENDING_APPROVAL',
        imageIds: existingImages.map((img) => img.id),
      };

      let response;
      if (mode === 'create') {
        response = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/listings/${initialData?.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save listing');
      }

      router.push('/my-listings');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Celestron NexStar 8SE Telescope"
              required
              maxLength={100}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="block text-sm font-medium mb-1">
                Condition *
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select condition...</option>
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label} - {cond.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your item in detail. Include specs, history, any issues, and what's included..."
              required
              rows={6}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Be detailed - include specs, accessories, any issues, and reason for selling.
            </p>
          </div>
        </div>
      </section>

      {/* Item Details */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Item Details</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="brand" className="block text-sm font-medium mb-1">
              Brand
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g., Celestron, Meade, Televue"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium mb-1">
              Model
            </label>
            <input
              id="model"
              name="model"
              type="text"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g., NexStar 8SE"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="yearMade" className="block text-sm font-medium mb-1">
              Year Made/Purchased
            </label>
            <input
              id="yearMade"
              name="yearMade"
              type="number"
              value={formData.yearMade}
              onChange={handleChange}
              placeholder="e.g., 2020"
              min={1900}
              max={new Date().getFullYear()}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="originalPrice" className="block text-sm font-medium mb-1">
              Original Price ($)
            </label>
            <input
              id="originalPrice"
              name="originalPrice"
              type="number"
              value={formData.originalPrice}
              onChange={handleChange}
              placeholder="What you paid originally"
              min={0}
              step="0.01"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Pricing</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="askingPrice" className="block text-sm font-medium mb-1">
              Asking Price ($) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                id="askingPrice"
                name="askingPrice"
                type="number"
                value={formData.askingPrice}
                onChange={handleChange}
                placeholder="0.00"
                required
                min={1}
                step="0.01"
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="acceptsOffers"
              name="acceptsOffers"
              type="checkbox"
              checked={formData.acceptsOffers}
              onChange={handleChange}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="acceptsOffers" className="text-sm">
              Accept offers (allow buyers to negotiate)
            </label>
          </div>

          {formData.acceptsOffers && (
            <div>
              <label htmlFor="minimumOffer" className="block text-sm font-medium mb-1">
                Minimum Offer ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  id="minimumOffer"
                  name="minimumOffer"
                  type="number"
                  value={formData.minimumOffer}
                  onChange={handleChange}
                  placeholder="Optional - lowest you'll consider"
                  min={0}
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Offers below this will be automatically rejected. Leave empty to consider all offers.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Location & Delivery */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Location & Delivery</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., St. Petersburg, FL"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                id="localPickupOnly"
                name="localPickupOnly"
                type="checkbox"
                checked={formData.localPickupOnly}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="localPickupOnly" className="text-sm">
                Local pickup available
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="shippingAvailable"
                name="shippingAvailable"
                type="checkbox"
                checked={formData.shippingAvailable}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="shippingAvailable" className="text-sm">
                Shipping available (buyer pays shipping)
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Photos</h2>

        {existingImages.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Current Photos</p>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((image) => (
                <div key={image.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt="Listing photo"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Photo upload coming soon
          </p>
          <p className="text-xs text-muted-foreground">
            Add up to 10 photos of your item
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            'Save as Draft'
          )}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === 'create' ? (
            <>
              <Upload className="h-4 w-4" />
              Submit for Review
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        All listings are reviewed before being published.
        This usually takes less than 24 hours.
      </p>
    </form>
  );
}
