export default function ServicesLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading services">
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

      {/* Category filter pills */}
      <div className="mx-auto flex max-w-4xl gap-3 px-4 sm:px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-28 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Service cards grid */}
      <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="skeleton mb-4 h-10 w-10 rounded-lg" />
              <div className="skeleton mb-2 h-5 w-3/4" />
              <div className="skeleton mb-1 h-4 w-full" />
              <div className="skeleton mb-4 h-4 w-2/3" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
