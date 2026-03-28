export default function StatusLoading() {
  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading system status"
    >
      <span className="sr-only">Loading system status, please wait...</span>

      {/* Header placeholder */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center">
            <div className="skeleton h-8 w-36" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 py-20">
        {/* Title */}
        <div className="skeleton mb-3 h-10 w-52" />
        <div className="skeleton mb-10 h-5 w-80" />

        {/* Overall status banner */}
        <div className="skeleton mb-8 h-16 w-full rounded-xl" />

        {/* Service status rows */}
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="skeleton h-3 w-3 rounded-full" />
                <div className="skeleton h-5 w-32" />
              </div>
              <div className="skeleton h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
