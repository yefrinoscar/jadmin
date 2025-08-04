import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { UsersTableSkeleton } from "./_components/users-skeleton";
import { UsersContent } from "./_components/users-content";

// Client component that receives hydrated data
export default function UsersPage() {


  // prefetch(
  //   trpc.users.getAll.queryOptions()
  // );

  // prefetch(
  //   trpc.users.getCurrentUser.queryOptions()
  // );
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra los miembros del equipo y sus permisos de acceso al sistema
        </p>
      </div>

      <HydrateClient>
        <Suspense fallback={<UsersTableSkeleton />}>
          <UsersContent />
        </Suspense>
      </HydrateClient>
    </div>
  );
}
