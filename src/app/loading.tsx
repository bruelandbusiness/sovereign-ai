export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="skeleton h-8 w-36" />
            <div className="hidden items-center gap-6 md:flex">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-20" />
            </div>
            <div className="skeleton hidden h-9 w-36 md:block" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="mx-auto max-w-4xl px-4 pt-24 text-center sm:px-6">
        <div className="skeleton mx-auto mb-6 h-14 w-3/4 sm:h-16" />
        <div className="skeleton mx-auto mb-4 h-6 w-2/3" />
        <div className="skeleton mx-auto mb-8 h-6 w-1/2" />
        <div className="flex justify-center gap-4">
          <div className="skeleton h-12 w-44" />
          <div className="skeleton h-12 w-36" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
