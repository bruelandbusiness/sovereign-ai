export default function LegalLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading legal">
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
        <div className="skeleton mx-auto mb-4 h-12 w-1/2" />
        <div className="skeleton mx-auto mb-10 h-6 w-2/3" />
      </div>

      {/* Legal content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton mb-3 h-6 w-48" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="skeleton h-4 w-full" />
                ))}
                <div className="skeleton h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
