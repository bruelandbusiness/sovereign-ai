export default function NotificationsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading notifications">
      {/* Dashboard header */}
      <div className="border-b border-border/40 bg-background/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="skeleton h-8 w-36" />
            <div className="flex items-center gap-4">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="skeleton h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Page title + actions */}
      <div className="mx-auto max-w-4xl w-full px-4 pt-8 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-8 w-40" />
          </div>
          <div className="skeleton h-9 w-32 rounded-lg" />
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4"
            >
              <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1">
                <div className="skeleton mb-2 h-4 w-3/4" />
                <div className="skeleton h-3 w-24" />
              </div>
              <div className="skeleton h-4 w-4 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
