export default function AuditLogLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading audit log">
      {/* Header */}
      <div>
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-40 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="animate-pulse rounded-xl border border-border/50 bg-card">
        <div className="border-b border-border/50 px-6 py-4">
          <div className="h-5 w-36 rounded bg-muted" />
        </div>
        <div className="space-y-3 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
