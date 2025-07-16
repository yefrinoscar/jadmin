"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TicketsTable } from "./tickets-table";

export function TicketsContent() {
  const trpc = useTRPC();
  
  // With useSuspenseQuery, the data is returned directly
  const { data: tickets } = useSuspenseQuery(trpc.tickets.getAll.queryOptions());

  return (
    <div className="space-y-4">
      <TicketsTable 
        data={tickets || []}  
      />
    </div>
  );
}
