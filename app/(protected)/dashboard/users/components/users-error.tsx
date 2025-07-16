import { UsersHeader } from "./users-header";

interface UsersErrorProps {
  errorMessage: string;
}

export function UsersError({ errorMessage }: UsersErrorProps) {
  return (
    <div className="space-y-4 p-4 md:p-8 pt-6">
      <UsersHeader />
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
      </div>
      <div className="text-center text-red-600">
        Error al cargar usuarios: {errorMessage}
      </div>
    </div>
  );
}
