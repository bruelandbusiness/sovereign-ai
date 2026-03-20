import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading service details">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <span className="sr-only">Loading service details, please wait...</span>
    </div>
  );
}
