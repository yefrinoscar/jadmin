"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ClientsTable } from "./clients-table";

export function ClientsContent() {
  const trpc = useTRPC();
  
  // With useSuspenseQuery, the data is returned directly
  const { data: clients } = useSuspenseQuery(trpc.clients.getAll.queryOptions());

  return (
    <div className="space-y-4">
      <ClientsTable 
        data={clients}  
      />
    </div>
  );
}
