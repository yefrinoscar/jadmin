import { Suspense } from "react";
import { HydrateClient } from "@/trpc/server";
import { ClientTicketsContent } from "./_components/client-tickets-content";

export default function ClientTicketsPage() {
  return (
    <div className="space-y-4 pt-6">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mis Tickets de Soporte</h1>
        <p className="text-muted-foreground">
          Visualiza y rastrea todas tus solicitudes de soporte
        </p>
      </div>
      
      <HydrateClient>
        <Suspense fallback={<div className="text-center py-10">Cargando tickets...</div>}>
          <ClientTicketsContent />
        </Suspense>
      </HydrateClient>
    </div>
  );
}
