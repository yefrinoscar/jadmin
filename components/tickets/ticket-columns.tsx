import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Copy, Building2 } from "lucide-react"

import { cn, parseServiceTags, cleanUserName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Ticket } from "@/lib/types/ticket"
import { User } from "@/lib/schemas"
import { AssignUserPopover } from "./assign-user-popover"
import { InteractiveStatusSelector } from "./interactive-status-selector"
import { InteractivePrioritySelector } from "./interactive-priority-selector"
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from "@/lib/schemas"

export const ticketColumns: ColumnDef<Ticket>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="w-[50px] flex justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="w-[50px] flex justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <div className="w-[110px]">  
        <span className="font-medium">Ticket ID</span>
      </div>
    ),
    cell: ({ row }) => {
      const fullId = row.getValue("id") as string
      
      const copyToClipboard = async (e: React.MouseEvent) => {
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(fullId)
          // Could add toast notification here if toast system is available
        } catch (err) {
          console.error('Failed to copy ticket ID:', err)
        }
      }
      
      return (
        <div className="group flex items-center gap-2 w-[110px]" title={fullId}>
          <span className="font-medium text-xs uppercase tracking-wide truncate">
            {fullId}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={copyToClipboard}
            title="Copiar ID del ticket"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    },
    size: 110,
  },
  {
    id: "service_tags",
    header: "Etiquetas de Servicio",
    cell: ({ row }) => {
      const ticket = row.original
      const serviceTags = ticket.service_tags || []
      
      if (serviceTags.length === 0) {
        return (
          <div className="text-xs text-muted-foreground italic w-[160px]">
            Sin etiquetas
          </div>
        )
      }
      
      return (
        <div className="flex flex-wrap gap-1 w-[160px] overflow-hidden">
          {serviceTags.slice(0, 2).map((serviceTag) => (
            <Badge 
              key={serviceTag.id} 
              variant="secondary" 
              className="text-xs font-mono px-2 py-1 truncate max-w-[70px]"
              title={`${serviceTag.tag} - ${serviceTag.description}`}
            >
              {serviceTag.tag}
            </Badge>
          ))}
          {serviceTags.length > 2 && (
            <Badge variant="outline" className="text-xs px-2 py-1 flex-shrink-0">
              +{serviceTags.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const ticket = row.original
      const serviceTags = ticket.service_tags || []
      return serviceTags.some(serviceTag => 
        serviceTag.tag.toLowerCase().includes(value.toLowerCase()) ||
        serviceTag.description.toLowerCase().includes(value.toLowerCase())
      )
    },
  },
  {
    accessorKey: "client_company_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Empresa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const companyName = row.getValue("client_company_name") as string
      return (
        <div className="w-[140px] flex items-center gap-2" title={companyName}>
          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate text-sm">{companyName || "Sin empresa"}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const companyName = row.getValue("client_company_name") as string
      return companyName?.toLowerCase().includes(value.toLowerCase()) || false
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Descripción
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const title = row.getValue("title") as string
      return (
        <div className="w-[200px] lg:w-[300px] truncate font-medium" title={title}>
          {title}
        </div>
      )
    },
  },
  {
    accessorKey: "assigned_user",
    header: "Asignado",
    cell: ({ row }) => {
      const assignedTo = row.getValue("assigned_user") as User
      const ticket = row.original
      
      return (
        <div className="w-[140px]" onClick={(e) => e.stopPropagation()}>
          <AssignUserPopover
            ticketId={ticket.id}
            currentAssignedUser={assignedTo}
          />
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof TICKET_STATUS_LABELS
      const ticket = row.original
      
      return (
        <div className="w-[140px]" onClick={(e) => e.stopPropagation()}>
          <InteractiveStatusSelector 
            ticketId={ticket.id}
            currentStatus={status}
          />
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "priority",
    header: "Prioridad",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as keyof typeof TICKET_PRIORITY_LABELS
      const ticket = row.original
      
      return (
        <div className="w-[120px]" onClick={(e) => e.stopPropagation()}>
          <InteractivePrioritySelector 
            ticketId={ticket.id}
            currentPriority={priority}
          />
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const ticket = row.original

      return (
        <div className="w-[50px] flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(ticket.id)}
              >
                Copiar ID del ticket
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Ver ticket</DropdownMenuItem>
              <DropdownMenuItem>Editar ticket</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Eliminar ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
] 