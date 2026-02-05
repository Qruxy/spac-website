/**
 * Events Page Loading State
 * 
 * Skeleton loader displayed while events are fetching.
 */

export default function EventsLoading() {
  return (
    <div className="py-12 animate-pulse">
      {/* Header skeleton */}
      <section className="container mx-auto px-4 mb-12">
        <div className="h-10 bg-muted rounded-lg w-64 mb-4" />
        <div className="h-6 bg-muted/60 rounded w-96 max-w-full" />
      </section>

      {/* Filter tabs skeleton */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-muted rounded-full w-24 flex-shrink-0" />
          ))}
        </div>
      </section>

      {/* View toggle skeleton */}
      <section className="container mx-auto px-4 mb-6">
        <div className="flex justify-end">
          <div className="h-10 bg-muted rounded-lg w-48" />
        </div>
      </section>

      {/* Events grid skeleton */}
      <section className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Image placeholder */}
      <div className="h-40 bg-muted" />
      
      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Badge */}
        <div className="h-6 bg-muted rounded-full w-20" />
        
        {/* Title */}
        <div className="h-6 bg-muted rounded w-full" />
        
        {/* Date & location */}
        <div className="space-y-2">
          <div className="h-4 bg-muted/60 rounded w-40" />
          <div className="h-4 bg-muted/60 rounded w-32" />
        </div>
        
        {/* Price/spots */}
        <div className="flex justify-between pt-2">
          <div className="h-5 bg-muted rounded w-16" />
          <div className="h-5 bg-muted rounded w-24" />
        </div>
      </div>
    </div>
  );
}
