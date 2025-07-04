"use client";

import { trpc } from "@/components/providers/trpc-provider";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ClientsTable } from "@/components/clients/clients-table";

export function ClientList() {
  const { data: clients, isLoading, error } = trpc.clients.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error al cargar clientes: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clients) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No se encontraron clientes</p>
            <p className="text-sm text-gray-400">
              Comienza agregando tu primer cliente
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-600">Gestiona la información de tus clientes y etiquetas de servicio</p>
      </div>
      <ClientsTable data={clients} />
    </div>
  );
} 