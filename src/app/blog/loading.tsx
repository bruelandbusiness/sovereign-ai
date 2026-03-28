export default function BlogLoading() {
  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading blog posts"
    >
      <span className="sr-only">Loading blog posts, please wait...</span>
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        {/* Title skeleton */}
        <div className="skeleton mb-10 h-10 w-48 rounded-lg" />

        {/* Card grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="skeleton mb-4 h-40 rounded-lg" />
              <div className="skeleton mb-2 h-5 w-3/4" />
              <div className="skeleton mb-2 h-4 w-full" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
