import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded" />
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div>
        <Skeleton className="h-6 w-28 mb-3" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div>
        <Skeleton className="h-6 w-24 mb-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-3 rounded-lg border p-4 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
