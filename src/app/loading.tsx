import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-96 max-w-full" />
      <div className="space-y-2 pt-4">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    </div>
  );
}
