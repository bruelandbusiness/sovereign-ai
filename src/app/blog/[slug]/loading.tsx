const LINE_WIDTHS = [85, 92, 78, 100, 88, 73, 95, 80, 97, 71, 90, 83];

export default function BlogPostLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading blog post">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        {/* Title bar skeleton */}
        <div className="mb-3 h-8 w-3/4 animate-pulse rounded-lg bg-muted" />
        <div className="mb-8 h-4 w-1/3 animate-pulse rounded bg-muted" />

        {/* Content lines skeleton */}
        <div className="space-y-3">
          {LINE_WIDTHS.map((width, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
