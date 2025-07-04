import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Copy, Building2, Mail, Phone, MapPin, Tags, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"

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
import { Database } from "@/lib/database.types"

type Client = Database["public"]["Tables"]["clients"]["Row"]

interface ClientWithStats extends Client {
  service_tags_count: number
  active_tickets_count: number
}

export const clientColumns: ColumnDef<ClientWithStats>[] = [
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
        <span className="font-medium">Client ID</span>
      </div>
    ),
    cell: ({ row }) => {
      const fullId = row.getValue("id") as string
      
      const copyToClipboard = async (e: React.MouseEvent) => {
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(fullId)
        } catch (err) {
          console.error('Failed to copy client ID:', err)
        }
      }
      
      return (
        <div className="group flex items-center gap-2 w-[110px]" title={fullId}>
          <span className="font-medium text-xs uppercase tracking-wide truncate">
            {fullId.slice(0, 8)}...
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={copyToClipboard}
            title="Copiar ID del cliente"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    },
    size: 110,
  },
  {
    accessorKey: "company_name",
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
      const companyName = row.getValue("company_name") as string
      return (
        <div className="w-[180px] flex items-center gap-2" title={companyName}>
          <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="truncate font-medium">{companyName}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Contacto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      return (
        <div className="w-[150px] truncate" title={name}>
          {name}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string
      return (
        <div className="w-[200px] flex items-center gap-2" title={email}>
          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate text-sm">{email}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string
      return (
        <div className="w-[120px] flex items-center gap-2" title={phone}>
          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate text-sm">{phone}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "address",
    header: "Dirección",
    cell: ({ row }) => {
      const address = row.getValue("address") as string
      return (
        <div className="w-[180px] flex items-center gap-2" title={address}>
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate text-sm">{address}</span>
        </div>
      )
    },
  },
  {
    id: "service_tags_count",
    header: "Etiquetas",
    cell: ({ row }) => {
      const count = row.original.service_tags_count
      return (
        <div className="w-[100px] flex items-center gap-2">
          <Tags className="h-4 w-4 text-muted-foreground" />
          <Badge variant={count > 0 ? "secondary" : "outline"}>
            {count}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "active_tickets_count",
    header: "Tickets Activos",
    cell: ({ row }) => {
      const count = row.original.active_tickets_count
      return (
        <div className="w-[120px] flex items-center gap-2">
          <Badge variant={count > 0 ? "default" : "outline"}>
            {count}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Creado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string
      return (
        <div className="w-[100px]">
          <span className="text-sm text-muted-foreground">
            {format(new Date(date), "MMM dd, yyyy")}
          </span>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const client = row.original

      return (
        <div className="w-[50px]" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(client.id)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar Cliente
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Tags className="mr-2 h-4 w-4" />
                Gestionar Etiquetas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
] 