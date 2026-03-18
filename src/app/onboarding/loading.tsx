export default function OnboardingLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center">
            <div className="skeleton h-8 w-36" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
        {/* Step indicator skeleton */}
        <div className="mb-4 flex items-center justify-between">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="flex items-center justify-between gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="skeleton hidden h-3 w-20 sm:block" />
            </div>
          ))}
        </div>
        <div className="skeleton mt-3 h-1.5 w-full rounded-full" />

        {/* Form skeleton */}
        <div className="mt-10 space-y-6">
          <div className="skeleton h-8 w-72" />
          <div className="skeleton h-4 w-56" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
          <div className="skeleton h-14 w-full" />
        </div>
      </div>
    </div>
  );
}
