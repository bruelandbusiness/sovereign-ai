export default function AdminSubLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading content">
      <span className="sr-only">Loading, please wait...</span>
      {/* Page title */}
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-border/50 bg-card"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="animate-pulse rounded-xl border border-border/50 bg-card">
        <div className="border-b border-border/50 px-6 py-4">
          <div className="h-5 w-36 rounded bg-muted" />
        </div>
        <div className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
