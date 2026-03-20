export default function BlogPostLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading blog post">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        {/* Title bar skeleton */}
        <div className="mb-3 h-8 w-3/4 animate-pulse rounded-lg bg-muted" />
        <div className="mb-8 h-4 w-1/3 animate-pulse rounded bg-muted" />

        {/* Content lines skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted"
              style={{ width: `${70 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
