/**
 * Newsletter Page Loading State
 * 
 * Skeleton loader displayed while newsletter archive is fetching.
 */

export default function NewsletterLoading() {
  return (
    <div className="py-12 animate-pulse">
      {/* Hero Section skeleton */}
      <section className="container mx-auto px-4 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-muted" />
          </div>

          {/* Title */}
          <div className="h-12 bg-muted rounded-lg w-96 max-w-full mx-auto mb-4" />

          {/* Subtitle */}
          <div className="h-6 bg-muted/60 rounded w-80 max-w-full mx-auto mb-2" />
          
          {/* Description */}
          <div className="space-y-2 mb-8">
            <div className="h-5 bg-muted/40 rounded w-full max-w-xl mx-auto" />
            <div className="h-5 bg-muted/40 rounded w-3/4 mx-auto" />
          </div>

          {/* Stats skeleton */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="h-10 bg-muted rounded w-16 mx-auto mb-1" />
              <div className="h-4 bg-muted/40 rounded w-12 mx-auto" />
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="h-10 bg-muted rounded w-28 mx-auto mb-1" />
              <div className="h-4 bg-muted/40 rounded w-20 mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Filters skeleton */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Year filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 bg-muted rounded-full w-16 flex-shrink-0" />
            ))}
          </div>
          
          {/* Search */}
          <div className="h-10 bg-muted rounded-lg w-64" />
        </div>
      </section>

      {/* Newsletter Grid skeleton */}
      <section className="container mx-auto px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <NewsletterCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* CTA Section skeleton */}
      <section className="container mx-auto px-4 mt-16">
        <div className="h-64 bg-muted/30 rounded-2xl" />
      </section>
    </div>
  );
}

function NewsletterCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* PDF preview placeholder */}
      <div className="aspect-[3/4] bg-muted" />
      
      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Date badge */}
        <div className="h-5 bg-muted rounded-full w-28" />
        
        {/* Title */}
        <div className="h-5 bg-muted rounded w-full" />
        
        {/* File size */}
        <div className="h-4 bg-muted/60 rounded w-16" />
      </div>
    </div>
  );
}
