export default function BlogLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading blog posts">
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        {/* Title skeleton */}
        <div className="mb-10 h-10 w-48 animate-pulse rounded-lg bg-muted" />

        {/* Card grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="mb-4 h-40 animate-pulse rounded-lg bg-muted" />
              <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
