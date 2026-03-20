import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading webhook details">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <span className="sr-only">Loading webhook details, please wait...</span>
    </div>
  );
}
