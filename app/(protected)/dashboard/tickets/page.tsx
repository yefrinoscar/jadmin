"use client";

import { TicketsTable } from "@/components/tickets/tickets-table";
import { trpc } from "@/components/providers/trpc-provider";

export default function TicketsPage() {
  const { data: tickets, isLoading, error } = trpc.tickets.getAll.useQuery();

  // Numero de serie
  // El cliente puede hacer comentarios
  // El cliente puede cambiar la priorizacion
  // La actualizacion del ticket deveria enviar un correo
    // Cuando comenta un usuario envia un comentario
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
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 md:p-8 pt-6">
        {/* Page header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Tickets de Soporte</h1>
          <p className="text-muted-foreground">
            Gestiona y rastrea todas las solicitudes de soporte y problemas de clientes
          </p>
        </div>
        <div className="space-y-4">
          {/* Filter skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <div className="h-8 w-[250px] bg-muted animate-pulse rounded" />
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        <div className="text-center text-red-600">
          Error al cargar tickets: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      {/* Page header */}
      <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Tickets de Soporte</h1>
        <p className="text-muted-foreground">
            Gestiona y rastrea todas las solicitudes de soporte y problemas de clientes
        </p>
      </div>
      <TicketsTable data={tickets || []} />
    </div>
  );
} 