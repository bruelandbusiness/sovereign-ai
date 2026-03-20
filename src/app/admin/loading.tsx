export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background" role="status" aria-label="Loading admin panel">
      {/* Sidebar skeleton */}
      <div className="fixed inset-y-0 left-0 hidden w-60 border-r border-border/40 bg-background lg:block">
        <div className="flex h-16 items-center px-6">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2 px-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="lg:pl-60">
        <div className="px-6 py-8 pt-20 lg:px-8 lg:pt-8">
          {/* Page title */}
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />

          {/* Stats row */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-border/50 bg-card"
              />
            ))}
          </div>

          {/* Table skeleton */}
          <div className="mt-8 animate-pulse rounded-xl border border-border/50 bg-card">
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
      </div>
    </div>
  );
}
