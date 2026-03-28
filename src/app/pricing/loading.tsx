export default function PricingLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-busy="true" aria-label="Loading pricing">
      <span className="sr-only">Loading pricing plans, please wait...</span>
      {/* Header placeholder */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="skeleton h-8 w-36" />
            <div className="hidden items-center gap-6 md:flex">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-3xl px-4 pt-20 text-center sm:px-6">
        <div className="skeleton mx-auto mb-4 h-12 w-2/3" />
        <div className="skeleton mx-auto mb-8 h-6 w-1/2" />
      </div>

      {/* Toggle skeleton */}
      <div className="mx-auto mb-12 flex items-center gap-4">
        <div className="skeleton h-10 w-56 rounded-full" />
      </div>

      {/* Pricing cards */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-6"
            >
              <div className="skeleton mb-4 h-6 w-24" />
              <div className="skeleton mb-2 h-10 w-32" />
              <div className="skeleton mb-6 h-4 w-full" />
              <div className="skeleton mb-8 h-11 w-full rounded-lg" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="skeleton h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
