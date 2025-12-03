import { Suspense } from "react";
import { HydrateClient } from "@/trpc/server";
import { ClientTicketsContent } from "./_components/client-tickets-content";
import { ClientProfile } from "./_components/client-profile";

export default function ClientTicketsPage() {
  return (
    <div className="space-y-6 pt-6">
      {/* User Profile Section */}
      <ClientProfile />
  
      
      {/* Tickets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mis Tickets de Soporte</h2>
            <p className="text-gray-600 mt-1">
              Visualiza y rastrea todas tus solicitudes de soporte
            </p>
          </div>
        </div>
      </div>
      
      <HydrateClient>
        <Suspense fallback={<div className="text-center py-10">Cargando tickets...</div>}>
          <ClientTicketsContent />
        </Suspense>
      </HydrateClient>
    </div>
  );
}
