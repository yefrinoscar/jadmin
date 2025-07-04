"use client";

import { UsersTable } from "@/components/users/users-table";
import { trpc } from "@/components/providers/trpc-provider";

export default function UsersPage() {
  const { data: users, isLoading, error, refetch } = trpc.users.getAll.useQuery();

  const handleUserCreated = () => {
    refetch();
  };

  if (isLoading) {
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

  if (error) {
    return (
      <div className="space-y-4 p-4 md:p-8 pt-6">
        {/* Page header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los miembros del equipo y sus permisos de acceso al sistema
          </p>
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
        </div>
        <div className="text-center text-red-600">
          Error al cargar usuarios: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      {/* Page header */}
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra los miembros del equipo y sus permisos de acceso al sistema
        </p>
      </div>
      
      <UsersTable 
        data={users || []} 
        onUserCreated={handleUserCreated}
      />
    </div>
  );
} 