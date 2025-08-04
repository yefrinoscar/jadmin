"use client"

import { format } from "date-fns"
import { FileText, User, Building, Building2, Camera, Clock, Copy, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyIdButton } from "../copy-id-button"
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badges"
import { TicketListItem } from "@/trpc/api/routers/tickets"
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_SOURCE_LABELS } from "@/lib/schemas/ticket"
import { InteractiveStatusSelector } from "../interactive-status-selector"
import { InteractivePrioritySelector } from "../interactive-priority-selector"
import { AssignUserPopover } from "../assign-user-popover"
import { EditableField } from "./editable-field"

interface TicketDetailsProps {
  ticket: TicketListItem
  users?: Array<{ id: string; name: string }>
}

export function TicketDetails({
  ticket,
  users
}: TicketDetailsProps) {

  return (
    <div className="space-y-4">

      <div className="space-y-3">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <EditableField label="Estado">
            <InteractiveStatusSelector 
              ticketId={ticket.id}
              currentStatus={ticket.status}
            />
          </EditableField>
          
          <EditableField label="Prioridad">
            <InteractivePrioritySelector 
              ticketId={ticket.id}
              currentPriority={ticket.priority}
            />
          </EditableField>
          
          <EditableField label="Asignado a">
            <AssignUserPopover 
              ticketId={ticket.id}
              currentAssignedUser={ticket.assigned_user ? {
                ...ticket.assigned_user,
                email: "",
                role: "technician" as const,
                auth_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } : null}
            />
          </EditableField>

          <EditableField label="Empresa">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs">{ticket.client_company_name || "Sin empresa"}</span>
            </div>
          </EditableField>




          <EditableField label="Descripción">
            <div className="text-xs">
              {ticket.title}
            </div>
          </EditableField>
        </div>
      </div>
    </div>
  )
}
