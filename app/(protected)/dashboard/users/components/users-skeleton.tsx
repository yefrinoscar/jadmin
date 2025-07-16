import { Skeleton } from "@/components/ui/skeleton";

export function UsersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="rounded-md border">
        <div className="h-12 border-b px-4 flex items-center">
          <Skeleton className="h-4 w-4 mr-3" />
          <Skeleton className="h-4 w-32 mr-6" />
          <Skeleton className="h-4 w-48 mr-6" />
          <Skeleton className="h-4 w-24 mr-6" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-16 border-b px-4 flex items-center">
            <Skeleton className="h-4 w-4 mr-3" />
            <Skeleton className="h-8 w-8 rounded-full mr-3" />
            <div className="space-y-2 mr-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-48 mr-6" />
            <Skeleton className="h-6 w-20 rounded-full mr-6" />
            <Skeleton className="h-4 w-24 mr-6" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}

export function UsersContentSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-8 pt-6">
      {/* Page header skeleton */}
      <div className="space-y-2 mb-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-4">
        {/* Filter skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <div className="h-8 w-[250px] bg-muted animate-pulse rounded" />
            <div className="h-8 w-[150px] bg-muted animate-pulse rounded" />
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        {/* Table skeleton */}
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
