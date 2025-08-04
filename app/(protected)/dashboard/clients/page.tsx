import { HydrateClient, prefetch, trpc } from "@/trpc/server"
import { Suspense } from "react"
import { ClientsTableSkeleton } from "./_components/clients-table-skeleton"
import { ClientsContent } from "./_components/users-content"

export default function ClientsPage() {

  // prefetch(
  //   trpc.clients.getAll.queryOptions()
  // );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
      </div>
      
      <HydrateClient>
        <Suspense fallback={<ClientsTableSkeleton />}>
          <ClientsContent />
        </Suspense>
      </HydrateClient>
    </div>
  );
}