export default function DetailLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading details">
      <span className="sr-only">Loading, please wait...</span>
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="h-8 w-36 animate-pulse rounded bg-muted" />
            <div className="hidden h-9 w-36 animate-pulse rounded bg-muted md:block" />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="mb-6 h-10 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mb-4 h-5 w-full animate-pulse rounded bg-muted" />
        <div className="mb-4 h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border/50 bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
