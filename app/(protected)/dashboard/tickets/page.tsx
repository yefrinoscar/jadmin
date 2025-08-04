import { Suspense } from "react";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { TicketsTableSkeleton } from "./_components/tickets-table-skeleton";
import { TicketsContent } from "./_components/tickets-content";

export default function TicketsPage() {
  // Prefetch tickets data to prime the React Query cache
  // prefetch(
  //   trpc.tickets.getAll.queryOptions()
  // );

  return (
    <div className="space-y-4 pt-6">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Tickets de Soporte</h1>
        <p className="text-muted-foreground">
          Gestiona y rastrea todas las solicitudes de soporte y problemas de clientes
        </p>
      </div>
      
        <HydrateClient>
          <Suspense fallback={<TicketsTableSkeleton />}>
            <TicketsContent />
          </Suspense>
        </HydrateClient>
    </div>
  );
} 