export default function ReportsLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading reports"
    >
      <span className="sr-only">Loading reports, please wait...</span>

      {/* Back link + page header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center">
        <div className="skeleton h-8 w-24 rounded-lg" />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="skeleton h-6 w-6 rounded" />
            <div className="skeleton h-7 w-28 rounded" />
          </div>
          <div className="skeleton h-4 w-72 rounded" />
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border/50 bg-card p-5 mb-8">
        <div className="flex items-start gap-3">
          <div className="skeleton h-5 w-5 rounded" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-full rounded" />
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-5"
          >
            <div className="skeleton h-3 w-20 rounded mb-2" />
            <div className="skeleton h-7 w-16 rounded mb-1" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="rounded-xl border border-border/50 bg-card p-5 mb-8">
        <div className="skeleton h-5 w-40 rounded mb-4" />
        <div className="skeleton h-64 w-full rounded-lg" />
      </div>

      {/* Report period cards */}
      <div className="skeleton h-5 w-36 rounded mb-4" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="skeleton h-4 w-4 rounded" />
              <div className="skeleton h-4 w-28 rounded" />
            </div>
            <div className="skeleton h-3 w-full rounded mb-4" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
