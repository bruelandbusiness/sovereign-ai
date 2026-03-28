import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center" role="status" aria-label="Loading page content">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="mt-6 h-10 w-64" />
      <Skeleton className="mt-3 h-5 w-80" />
      <Skeleton className="mt-10 h-48 w-full max-w-lg" />
      <span className="sr-only">Loading page content, please wait...</span>
    </div>
  );
}
