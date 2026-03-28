export default function BlogPostLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading article">
      <span className="sr-only">Loading article, please wait...</span>
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="h-8 w-36 animate-pulse rounded bg-muted" />
            <div className="hidden h-9 w-36 animate-pulse rounded bg-muted md:block" />
          </div>
        </div>
      </div>
      <article className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="mb-4 h-10 w-full animate-pulse rounded bg-muted" />
        <div className="mb-8 h-10 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mb-8 h-64 w-full animate-pulse rounded-xl bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </article>
    </div>
  );
}
