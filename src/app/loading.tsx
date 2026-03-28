export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-busy="true" aria-label="Loading page content">
      <span className="sr-only">Loading page content, please wait...</span>
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="skeleton h-8 w-36" />
            <div className="hidden items-center gap-6 md:flex">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-20" />
            </div>
            <div className="skeleton hidden h-9 w-36 md:block" />
          </div>
        </div>
      </div>

      {/* Hero skeleton — matches HeroSection min-h-[90vh] to prevent CLS */}
      <div className="relative min-h-[90vh] bg-[var(--bg-primary)]">
        {/* Trust bar skeleton */}
        <div className="border-b border-white/[0.06] py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-center gap-6 px-4">
            <div className="skeleton h-4 w-48" />
            <div className="skeleton hidden h-4 w-32 sm:block" />
            <div className="skeleton hidden h-4 w-28 sm:block" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="mx-auto max-w-4xl px-4 pt-20 text-center sm:px-6 sm:pt-28">
          <div className="skeleton mx-auto mb-6 h-8 w-64" />
          <div className="skeleton mx-auto mb-4 h-5 w-72" />
          <div className="skeleton mx-auto mb-6 h-16 w-full max-w-2xl sm:h-20" />
          <div className="skeleton mx-auto mb-4 h-6 w-2/3" />
          <div className="skeleton mx-auto mb-8 h-6 w-1/2" />
          <div className="flex justify-center gap-4">
            <div className="skeleton h-14 w-64" />
            <div className="skeleton h-14 w-44" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
