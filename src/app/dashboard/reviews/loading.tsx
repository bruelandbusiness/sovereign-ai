export default function DashboardSubLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6" role="status" aria-busy="true" aria-label="Loading dashboard section">
      <span className="sr-only">Loading, please wait...</span>
      {/* Page header skeleton */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-6 w-6 animate-pulse rounded bg-muted" />
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border/50 bg-card" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    </div>
  );
}
