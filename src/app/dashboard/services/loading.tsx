export default function ServicesLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading services"
    >
      <span className="sr-only">Loading services, please wait...</span>

      {/* Page header */}
      <div className="mb-8">
        <div className="skeleton h-7 w-44 rounded mb-2" />
        <div className="skeleton h-4 w-72 rounded" />
      </div>

      {/* Service cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="skeleton h-9 w-9 rounded-lg" />
              <div className="skeleton h-5 w-32 rounded" />
            </div>
            <div className="skeleton h-4 w-full rounded mb-1" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
