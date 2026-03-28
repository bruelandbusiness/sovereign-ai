export default function ProductsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading products">
      <div className="mx-auto w-full max-w-7xl px-6 py-16">
        {/* Title skeleton */}
        <div className="mb-4 h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="mb-10 h-5 w-96 animate-pulse rounded bg-muted" />

        {/* Filter bar skeleton */}
        <div className="mb-8 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-muted" />
          ))}
        </div>

        {/* Product grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="mb-4 h-40 animate-pulse rounded-lg bg-muted" />
              <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mb-3 h-4 w-full animate-pulse rounded bg-muted" />
              <div className="flex items-center justify-between">
                <div className="h-6 w-16 animate-pulse rounded bg-muted" />
                <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
