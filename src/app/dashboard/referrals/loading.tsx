import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading referrals">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      {/* Motivational banner */}
      <Skeleton className="h-24 w-full rounded-xl" />

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      {/* Referral link card */}
      <Skeleton className="h-40 w-full rounded-xl" />

      {/* Rewards tracker */}
      <Skeleton className="h-56 w-full rounded-xl" />

      {/* Invite by email */}
      <Skeleton className="h-44 w-full rounded-xl" />

      {/* Referral table */}
      <Skeleton className="h-6 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>

      {/* Leaderboard */}
      <Skeleton className="h-64 w-full rounded-xl" />

      <span className="sr-only">Loading referrals...</span>
    </div>
  );
}
