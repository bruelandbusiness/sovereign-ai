import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading automation settings">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <span className="sr-only">Loading automation settings, please wait...</span>
    </div>
  );
}
