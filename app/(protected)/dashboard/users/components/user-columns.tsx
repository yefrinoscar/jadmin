import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Copy, Mail, Calendar, User as UserIcon, Shield, ShieldCheck, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { useTRPC } from "@/trpc/client"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { User } from "@/lib/schemas"
import { EditUserDialog } from "./edit-user-dialog"

// This is intentionally left empty as we'll update the existing interface below

const roleColors: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  technician: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  client: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  manager: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

const roleIcons: Record<string, any> = {
  superadmin: Shield,
  admin: ShieldCheck,
  technician: UserIcon,
  manager: Shield,
  viewer: UserCheck,
  client: UserIcon,
}

const roleLabels: Record<string, string> = {
  superadmin: "Super Administrador",
  admin: "Administrador",
  technician: "Técnico",
  client: "Cliente",
  manager: "Gerente",
  viewer: "Visualizador",
}

export type UserWithCount = User & {
  assigned_tickets_count?: number
  last_sign_in_at?: string
  is_disabled?: boolean
}

// Define the column meta type to include onUserUpdated and currentUserRole
type UserColumnMeta = {
  onUserUpdated?: () => void;
  currentUserRole?: string;
}

// Status badge component for active/inactive users
const StatusBadge = ({ isDisabled }: { isDisabled?: boolean }) => {
  if (isDisabled) {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800">
        Inactivo
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
      Activo
    </Badge>
  )
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
    accessorKey: "is_disabled",
    header: "Estado",
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="w-[100px]">
          <StatusBadge isDisabled={user.is_disabled} />
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
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
    enableSorting: false,
    enableHiding: false,
    meta: {
      onUserUpdated: undefined,
      currentUserRole: undefined
    },
    cell: ({ row, column }) => {
      const user = row.original
      const columnMeta = column.columnDef.meta as UserColumnMeta;
      const onUserUpdated = columnMeta?.onUserUpdated;
      const currentUserRole = columnMeta?.currentUserRole;
      
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
      
      const trpc = useTRPC();
      
      // Check if current user can modify this user based on roles
      const isSuperAdmin = user.role === 'superadmin';
      const isCurrentUserSuperAdmin = currentUserRole === 'superadmin';
      const canModifySuperAdmin = isCurrentUserSuperAdmin || !isSuperAdmin;
      
      // Set up the toggle status mutation
      const toggleStatusOptions = trpc.users.toggleUserStatus.mutationOptions({
        onSuccess: () => {
          // Trigger a refetch of the users data
          onUserUpdated?.();
          toast.success("Estado del usuario actualizado correctamente");
        },
        onError: (error) => {
          console.error("Error toggling user status:", error);
          toast.error(`Error al cambiar estado del usuario: ${error.message}`);
        },
      })
      
      const toggleStatusMutation = useMutation(toggleStatusOptions)
      
      // Set up the delete user mutation
      const deleteUserOptions = trpc.users.deleteUser.mutationOptions({
        onSuccess: () => {
          // Close the delete dialog
          setIsDeleteDialogOpen(false);
          
          // Trigger a refetch of the users data
          onUserUpdated?.();

          // Show success notification
          toast.success("Usuario eliminado correctamente");
        },
        onError: (error) => {
          console.error("Error deleting user:", error);
          toast.error(`Error al eliminar usuario: ${error.message}`);
        },
      })
      
      const deleteUserMutation = useMutation(deleteUserOptions)
      
      // Check if user can be deleted (has no assigned tickets)
      const canDelete = user.assigned_tickets_count === 0

      return (
        <div className="w-[50px] flex justify-center">
          <EditUserDialog  
            user={user} 
            open={isEditDialogOpen} 
            onOpenChange={setIsEditDialogOpen}
            onUserUpdated={() => {
              // Trigger a refetch of the users data
              onUserUpdated?.();
            }}
          >
            <span></span>
          </EditUserDialog>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                {canModifySuperAdmin ? (
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    Editar usuario
                  </DropdownMenuItem>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem 
                          className="opacity-50 cursor-not-allowed"
                          disabled={true}
                        >
                          Editar usuario
                        </DropdownMenuItem>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>No tienes permisos para modificar usuarios con rol de superadmin</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <DropdownMenuSeparator />
              {/* Always show disable/enable option */}
              {canModifySuperAdmin ? (
                <DropdownMenuItem 
                  className={user.is_disabled ? "text-green-600" : "text-red-600"}
                  disabled={toggleStatusMutation.isPending}
                  onClick={() => {
                    const isCurrentlyDisabled = !!user.is_disabled;
                    
                    // Call the mutation using the proper pattern
                    toggleStatusMutation.mutate({
                      id: user.id,
                      isDisabled: !isCurrentlyDisabled
                    });
                  }}
                >
                  {toggleStatusMutation.isPending ? "Procesando..." : (user.is_disabled ? "Activar usuario" : "Desactivar usuario")}
                </DropdownMenuItem>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DropdownMenuItem 
                        className={`${user.is_disabled ? "text-green-600" : "text-red-600"} opacity-50 cursor-not-allowed`}
                        disabled={true}
                      >
                        {user.is_disabled ? "Activar usuario" : "Desactivar usuario"}
                      </DropdownMenuItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>No tienes permisos para cambiar el estado de usuarios con rol de superadmin</p>
                  </TooltipContent>
                </Tooltip>
              )}
                            
              {/* Always show delete option but disable it if user has tickets or is superadmin */}
              {!canModifySuperAdmin ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DropdownMenuItem 
                        className="text-red-600 font-medium opacity-50 cursor-not-allowed"
                        disabled={true}
                      >
                        Eliminar usuario
                      </DropdownMenuItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>No tienes permisos para eliminar usuarios con rol de superadmin</p>
                  </TooltipContent>
                </Tooltip>
              ) : (user.assigned_tickets_count || 0) > 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DropdownMenuItem 
                        className="text-red-600 font-medium opacity-50 cursor-not-allowed"
                        disabled={true}
                      >
                        Eliminar usuario
                      </DropdownMenuItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>No se puede eliminar un usuario con tickets asignados</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <DropdownMenuItem 
                  className="text-red-600 font-medium"
                  disabled={deleteUserMutation.isPending}
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  {deleteUserMutation.isPending ? "Procesando..." : "Eliminar usuario"}
                </DropdownMenuItem>
              )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Delete confirmation dialog */}
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro que desea eliminar este usuario?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    deleteUserMutation.mutate({
                      id: user.id
                    });
                  }}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    },
  },
]
