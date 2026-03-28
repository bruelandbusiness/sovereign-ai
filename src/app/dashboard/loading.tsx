export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-busy="true" aria-label="Loading dashboard">
      <span className="sr-only">Loading dashboard, please wait...</span>
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center">
            <div className="skeleton h-8 w-36" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="skeleton h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-7 w-64" />
            <div className="skeleton h-4 w-40" />
          </div>
        </div>

        {/* Goal banner skeleton */}
        <div className="skeleton mt-6 h-24 w-full" />

        {/* KPI grid skeleton */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 w-full" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="skeleton h-80 w-full" />
          <div className="skeleton h-80 w-full" />
        </div>
      </div>
    </div>
  );
}
