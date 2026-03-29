export default function ReviewsLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading reviews"
    >
      <span className="sr-only">Loading reviews, please wait...</span>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="skeleton h-6 w-6 rounded" />
        <div className="skeleton h-7 w-36 rounded" />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-5"
          >
            <div className="skeleton h-3 w-20 rounded mb-2" />
            <div className="skeleton h-7 w-16 rounded mb-1" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="skeleton h-10 w-40 rounded-lg" />
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-5"
          >
            <div className="flex items-start gap-4">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-4 w-24 rounded" />
                </div>
                {/* Star rating */}
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="skeleton h-4 w-4 rounded" />
                  ))}
                </div>
                {/* Review text */}
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <div className="skeleton h-8 w-20 rounded-lg" />
                  <div className="skeleton h-8 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
