import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Copy, Mail, Calendar, User as UserIcon, Shield, ShieldCheck, UserCheck } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { User } from "@/lib/schemas"

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  technician: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  manager: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  client: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

const roleIcons: Record<string, any> = {
  admin: ShieldCheck,
  technician: UserIcon,
  manager: Shield,
  viewer: UserCheck,
  client: UserIcon,
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  technician: "Técnico",
  manager: "Gerente",
  viewer: "Visualizador",
  client: "Cliente",
}

export interface UserWithCount extends User {
  assigned_tickets_count?: number
  last_sign_in_at?: string
}

export const userColumns: ColumnDef<UserWithCount>[] = [
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Usuario
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const user = row.original
      const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      
      return (
        <div className="flex items-center gap-3 w-[200px]">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {user.assigned_tickets_count || 0} tickets asignados
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const email = row.getValue("email") as string
      
      const copyToClipboard = async (e: React.MouseEvent) => {
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(email)
          // Could add toast notification here if toast system is available
        } catch (err) {
          console.error('Failed to copy email:', err)
        }
      }
      
      return (
        <div className="group flex items-center gap-2 w-[200px]" title={email}>
          <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate">{email}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={copyToClipboard}
            title="Copiar email"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      const RoleIcon = roleIcons[role] || UserIcon
      
      return (
        <div className="w-[120px]">
          <Badge className={`${roleColors[role]} text-xs`}>
            <RoleIcon className="w-3 h-3 mr-1" />
            {roleLabels[role] || role}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
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
          Se Unió
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string
      
      return (
        <div className="w-[120px] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(date), "MMM dd, yyyy")}
          </span>
        </div>
      )
    },
  },
  {
    id: "last_activity",
    header: "Última Actividad",
    cell: ({ row }) => {
      const user = row.original
      const lastActivity = user.last_sign_in_at
      
      return (
        <div className="w-[140px]">
          {lastActivity ? (
            <span className="text-sm text-muted-foreground">
              {format(new Date(lastActivity), "MMM dd, HH:mm")}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground italic">
              Nunca
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original

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
                onClick={() => navigator.clipboard.writeText(user.email)}
              >
                Copiar email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Ver usuario</DropdownMenuItem>
              <DropdownMenuItem>Editar usuario</DropdownMenuItem>
              <DropdownMenuItem>Cambiar rol</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Desactivar usuario
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
] 