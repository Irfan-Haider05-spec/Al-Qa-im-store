import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-content px-5 pb-20 pt-36 sm:px-8 lg:px-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="space-y-4">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-48 rounded-pill" />
        </div>
      </div>
    </div>
  );
}
