import Skeleton from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-sand-beige px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Image Gallery Skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-4 aspect-video w-full rounded-xl" />
          {/* Thumbnail row skeleton */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Header Skeleton */}
        <div className="mb-12 text-center">
          <Skeleton className="mx-auto mb-4 h-12 w-3/4 max-w-2xl" />
          <Skeleton className="mx-auto mb-6 h-6 w-1/2 max-w-xl" />
          <Skeleton className="mx-auto h-10 w-32 rounded-full" />
        </div>

        {/* Content Sections Skeleton */}
        <div className="mb-12 space-y-8">
          {/* AI Summary Section */}
          <div className="rounded-xl bg-white/50 p-8 backdrop-blur-sm">
            <Skeleton className="mb-6 h-8 w-48" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>

          {/* Timeline Steps Skeleton */}
          <div className="space-y-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-start gap-6">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}




