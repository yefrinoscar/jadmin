"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Clock, Hash } from "lucide-react"
import { CopyIdButton } from "../copy-id-button"
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { TicketListItem } from "@/trpc/api/routers/tickets"

interface TicketHeaderProps {
  ticket: TicketListItem
}

export function TicketHeader({ 
  ticket 
}: TicketHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      <SheetHeader className="px-6 pt-4 pb-2">
        <div className="flex flex-col">
          <SheetTitle className="text-sm font-bold">
            {ticket.title}
          </SheetTitle>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 group">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{ticket.id}</span>
              <CopyIdButton id={ticket.id} />
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Creado el {format(new Date(ticket.created_at), "dd MMM yyyy")}
              </span>
            </div>
          </div>
        </div>
      </SheetHeader>
    </div>
  )
}
