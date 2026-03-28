export default function ContactLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading contact page">
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
      <div className="mx-auto max-w-2xl px-4 pt-20 text-center sm:px-6">
        <div className="skeleton mx-auto mb-4 h-12 w-56" />
        <div className="skeleton mx-auto mb-12 h-5 w-72" />
      </div>

      {/* Contact channel cards */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-5 rounded-xl border border-border/50 bg-card p-6"
            >
              <div className="skeleton h-12 w-12 shrink-0 rounded-lg" />
              <div className="flex-1">
                <div className="skeleton mb-2 h-5 w-36" />
                <div className="skeleton mb-1 h-4 w-full" />
                <div className="skeleton h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
