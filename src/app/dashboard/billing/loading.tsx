export default function BillingLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading billing"
    >
      <span className="sr-only">Loading billing, please wait...</span>

      {/* Back link + page header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center">
        <div className="skeleton h-8 w-24 rounded-lg" />
        <div>
          <div className="skeleton h-7 w-40 rounded mb-2" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
      </div>

      {/* Plan card */}
      <div className="rounded-xl border border-border/50 bg-card p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="skeleton h-5 w-32 rounded" />
            <div className="skeleton h-8 w-48 rounded" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
        <div className="skeleton h-4 w-56 rounded mb-4" />
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex gap-3 pt-4 border-t border-border/40">
          <div className="skeleton h-10 w-36 rounded-lg" />
          <div className="skeleton h-10 w-36 rounded-lg" />
        </div>
      </div>

      {/* Active services */}
      <div className="mb-8">
        <div className="skeleton h-6 w-36 rounded mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="skeleton h-4 w-28 rounded" />
              </div>
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Invoice list */}
      <div className="skeleton h-6 w-36 rounded mb-4" />
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-5 py-4 border-b border-border/30 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-4 w-40 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton h-6 w-16 rounded-full" />
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
