/**
 * Gallery Page Loading State
 * 
 * Skeleton loader displayed while gallery photos are fetching.
 */

export default function GalleryLoading() {
  return (
    <div className="py-12 animate-pulse">
      {/* Hero Section skeleton */}
      <section className="container mx-auto px-4 mb-16">
        <div className="text-center mb-8">
          {/* Badge */}
          <div className="h-8 bg-muted rounded-full w-48 mx-auto mb-6" />
          
          {/* Title */}
          <div className="h-14 bg-muted rounded-lg w-80 mx-auto mb-4" />
          
          {/* Description */}
          <div className="space-y-2 max-w-2xl mx-auto">
            <div className="h-6 bg-muted/60 rounded w-full" />
            <div className="h-6 bg-muted/60 rounded w-3/4 mx-auto" />
          </div>
        </div>

        {/* Submit button skeleton */}
        <div className="flex justify-center mb-8">
          <div className="h-12 bg-muted rounded-full w-48" />
        </div>

        {/* Featured carousel placeholder */}
        <div className="h-[400px] md:h-[500px] w-full rounded-2xl bg-muted/30 border border-border" />
      </section>

      {/* Category Filters skeleton */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-10 bg-muted rounded-full w-24 flex-shrink-0" />
          ))}
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="container mx-auto px-4 mb-8">
        <div className="h-5 bg-muted/60 rounded w-32" />
      </section>

      {/* Photo Grid skeleton (Masonry-like) */}
      <section className="container mx-auto px-4">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {[220, 280, 200, 320, 240, 260, 300, 180, 280, 240, 220, 260].map((height, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-xl bg-muted"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
