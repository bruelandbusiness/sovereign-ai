export default function CaseStudiesLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading case studies">
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
        <div className="skeleton mx-auto mb-4 h-12 w-64" />
        <div className="skeleton mx-auto mb-12 h-5 w-80" />
      </div>

      {/* Case study cards */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card overflow-hidden"
            >
              <div className="skeleton h-48 w-full rounded-none" />
              <div className="p-6">
                <div className="skeleton mb-2 h-5 w-3/4" />
                <div className="skeleton mb-1 h-4 w-full" />
                <div className="skeleton mb-4 h-4 w-2/3" />
                <div className="flex gap-4">
                  <div className="skeleton h-8 w-20 rounded-full" />
                  <div className="skeleton h-8 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
