export default function AuditLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center">
            <div className="skeleton h-8 w-36" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-20 text-center sm:px-6">
        <div className="skeleton mx-auto mb-4 h-8 w-40" />
        <div className="skeleton mx-auto mb-6 h-14 w-4/5" />
        <div className="skeleton mx-auto mb-8 h-6 w-2/3" />
      </div>

      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="space-y-4">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      </div>
    </div>
  );
}
