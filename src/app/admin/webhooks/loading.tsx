export default function WebhooksLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading webhook deliveries">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {/* Header row */}
        <div className="border-b border-border/50 px-4 py-3">
          <div className="flex gap-8">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 w-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
        {/* Body rows */}
        <div className="divide-y divide-border/30">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 py-3">
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-10 animate-pulse rounded bg-muted" />
              <div className="h-4 w-12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-8 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
