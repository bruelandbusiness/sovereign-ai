export default function AboutLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading about page">
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
        <div className="skeleton mx-auto mb-4 h-14 w-2/3" />
        <div className="skeleton mx-auto mb-6 h-5 w-3/4" />
        <div className="skeleton mx-auto mb-16 h-5 w-1/2" />
      </div>

      {/* Values grid */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="skeleton mx-auto mb-8 h-8 w-40" />
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-6"
            >
              <div className="skeleton mb-3 h-10 w-10 rounded-lg" />
              <div className="skeleton mb-2 h-5 w-36" />
              <div className="skeleton mb-1 h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
