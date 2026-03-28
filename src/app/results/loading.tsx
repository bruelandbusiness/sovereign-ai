export default function ResultsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading results">
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
        <div className="skeleton mx-auto mb-4 h-12 w-2/3" />
        <div className="skeleton mx-auto mb-10 h-6 w-1/2" />
      </div>

      {/* Stats row */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mb-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-6 text-center">
              <div className="skeleton mx-auto mb-2 h-10 w-24" />
              <div className="skeleton mx-auto h-4 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Result cards */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-6"
            >
              <div className="skeleton mb-3 h-6 w-3/4" />
              <div className="skeleton mb-2 h-4 w-full" />
              <div className="skeleton mb-4 h-4 w-2/3" />
              <div className="flex gap-4">
                <div className="skeleton h-8 w-20 rounded-lg" />
                <div className="skeleton h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
