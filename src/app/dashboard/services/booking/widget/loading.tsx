import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading booking widget">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-10" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
      <span className="sr-only">Loading booking widget, please wait...</span>
    </div>
  );
}
