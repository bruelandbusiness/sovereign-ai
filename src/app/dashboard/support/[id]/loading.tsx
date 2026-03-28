import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading ticket details">
      <Skeleton className="h-4 w-20" />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
      <span className="sr-only">Loading ticket details, please wait...</span>
    </div>
  );
}
