export default function VsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading comparison">
      {/* Header placeholder */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="skeleton h-8 w-36" />
            <div className="hidden items-center gap-6 md:flex">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-3xl px-4 pt-20 text-center sm:px-6">
        <div className="skeleton mx-auto mb-4 h-12 w-3/4" />
        <div className="skeleton mx-auto mb-10 h-6 w-2/3" />
      </div>

      {/* Comparison table */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          {/* Table header */}
          <div className="grid grid-cols-1 gap-4 mb-6 pb-4 border-b border-border/40 sm:grid-cols-3">
            <div className="skeleton h-6 w-24" />
            <div className="skeleton h-6 w-32" />
            <div className="skeleton h-6 w-32" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-3">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
