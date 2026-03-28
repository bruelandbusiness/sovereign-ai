export default function HelpLoading() {
  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading help center"
    >
      <span className="sr-only">Loading help center, please wait...</span>

      {/* Header placeholder */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center">
            <div className="skeleton h-8 w-36" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        {/* Page title */}
        <div className="skeleton mb-3 h-10 w-56" />
        <div className="skeleton mb-8 h-5 w-96" />

        {/* Search bar skeleton */}
        <div className="skeleton mb-12 h-12 w-full rounded-lg" />

        {/* Category cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-6"
            >
              <div className="skeleton mb-3 h-10 w-10 rounded-lg" />
              <div className="skeleton mb-2 h-5 w-3/4" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton mt-1 h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
