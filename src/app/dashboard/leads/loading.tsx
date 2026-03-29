export default function LeadsLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading leads"
    >
      <span className="sr-only">Loading leads, please wait...</span>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="skeleton h-6 w-6 rounded" />
        <div className="skeleton h-7 w-36 rounded" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="skeleton h-10 w-32 rounded-lg" />
        <div className="ml-auto skeleton h-10 w-28 rounded-lg" />
      </div>

      {/* Table header */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border/40">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-28" />
          <div className="ml-auto skeleton h-4 w-16" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-b-0"
          >
            <div className="skeleton h-9 w-9 rounded-full" />
            <div className="skeleton h-4 w-36" />
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-4 w-28" />
            <div className="ml-auto skeleton h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="skeleton h-4 w-32" />
        <div className="flex gap-2">
          <div className="skeleton h-8 w-8 rounded" />
          <div className="skeleton h-8 w-8 rounded" />
          <div className="skeleton h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}
