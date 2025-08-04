"use client"

import * as React from "react"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table"
import { Plus, X, User as UserIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { userColumns, UserWithCount } from "./user-columns"
import { CreateUserDialog } from "./create-user-dialog"

const userRoles = [
  {
    value: "superadmin",
    label: "Super Administrador",
  },
  {
    value: "admin",
    label: "Administrador",
  },
  {
    value: "technician", 
    label: "Técnico",
  },
  {
    value: "client",
    label: "Cliente",
  },
]

interface UsersTableProps {
  data: UserWithCount[]
  currentUserRole?: string
  onUserCreated?: () => void
  onUserUpdated?: () => void
}

export function UsersTable({ data, currentUserRole, onUserCreated, onUserUpdated }: UsersTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [selectedUser, setSelectedUser] = React.useState<UserWithCount | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = React.useState(false)
  const [showPinnedShadow, setShowPinnedShadow] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Dynamically create columns with the onUserUpdated callback and currentUserRole
  const columns = React.useMemo(() => {
    return userColumns.map(column => {
      // Pass onUserUpdated and currentUserRole to the actions column
      if (column.id === 'actions') {
        return {
          ...column,
          meta: { onUserUpdated, currentUserRole }
        };
      }
      return column;
    });
  }, [onUserUpdated, currentUserRole]);

  // Custom filter function for global search across name and email
  const fuzzyFilter = React.useCallback(
    (row: any, _columnId: string, filterValue: string): boolean => {
      if (!filterValue) return true;
      
      // Search across both name and email columns
      const name = row.getValue("name") as string | undefined;
      const email = row.getValue("email") as string | undefined;
      
      const searchTerm = filterValue.toLowerCase();
      return (
        (!!name && name.toLowerCase().includes(searchTerm)) ||
        (!!email && email.toLowerCase().includes(searchTerm))
      );
    },
    []
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
  })

  const isFiltered = table.getState().columnFilters.length > 0

  // Handle scroll to show/hide pinned column shadow
  const handleScroll = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      const hasScrollableContent = scrollWidth > clientWidth
      const isScrolled = scrollLeft > 0
      setShowPinnedShadow(hasScrollableContent && isScrolled)
    }
  }, [])

  // Check if there's content to scroll on the right
  const hasScrollableContent = React.useMemo(() => {
    if (!scrollContainerRef.current) return false
    const { scrollWidth, clientWidth } = scrollContainerRef.current
    return scrollWidth > clientWidth
  }, [data])

  // Check for scrollable content on mount and data change
  React.useEffect(() => {
    handleScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, data])

  const handleRowClick = (user: UserWithCount, event: React.MouseEvent) => {
    // Don't open drawer if clicking on checkbox, buttons, or other interactive elements
    const target = event.target as HTMLElement
    if (target.closest('button, input, [role="button"]')) {
      return
    }
    
    setSelectedUser(user)
    setIsDetailDrawerOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-1 flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
          <Input
            placeholder="Buscar por nombre o email..."
            value={globalFilter ?? ""}
            onChange={(event) => {
              setGlobalFilter(event.target.value);
            }}
            className="h-8 w-full md:w-[250px] lg:w-[350px]"
          />
          <div className="flex space-x-2">
            {table.getColumn("role") && (
              <DataTableFacetedFilter
                column={table.getColumn("role")}
                title="Rol"
                options={userRoles}
              />
            )}
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={() => table.resetColumnFilters()}
                className="h-8 px-2 lg:px-3"
              >
                Limpiar
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-8 hidden md:flex">
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>Alternar columnas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" && column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateUserDialog onUserCreated={onUserCreated}>
            <Button size="sm" className="h-8">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Usuario
            </Button>
          </CreateUserDialog>
        </div>
      </div>

      {/* Desktop Table with Pinned Columns */}
      <div className="hidden md:block">
        <div className="w-full rounded-lg border bg-background overflow-hidden relative">
          {/* Scroll indicator gradient */}
          {hasScrollableContent && (
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-40 opacity-60" />
          )}
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)]"
          >
            <Table className="relative">
              <TableHeader className="bg-muted sticky top-0 z-20">
                {table.getHeaderGroups().map((headerGroup: any) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header: any, index: number) => {
                      const isPinnedColumn = index === 0; // only name column is fixed
                      return (
                        <TableHead 
                          key={header.id} 
                          className={cn(
                            "text-xs font-medium whitespace-nowrap transition-shadow duration-200",
                            isPinnedColumn && "sticky z-30 bg-muted left-0",
                            isPinnedColumn && showPinnedShadow && "shadow-[2px_0_8px_rgba(0,0,0,0.15)]"
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row: any) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={(event) => handleRowClick(row.original, event)}
                    >
                      {row.getVisibleCells().map((cell: any, index: number) => {
                        const isPinnedColumn = index === 0; // only name column is fixed
                        return (
                          <TableCell 
                            key={cell.id} 
                            className={cn(
                              "text-sm whitespace-nowrap transition-shadow duration-200",
                              isPinnedColumn && "sticky z-10 bg-background left-0",
                              isPinnedColumn && showPinnedShadow && "shadow-[2px_0_8px_rgba(0,0,0,0.15)]"
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={userColumns.length}
                      className="h-16 text-center text-sm"
                    >
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row: any) => {
            const user = row.original;
            const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            
            return (
              <Card 
                key={row.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={(event) => handleRowClick(user, event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm leading-tight">{user.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                      </div>
                    </div>
                    <Badge className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Tickets:</span>
                      <p className="mt-1 font-medium">{user.assigned_tickets_count || 0} asignados</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Se unió:</span>
                      <p className="mt-1 font-medium">
                        {format(new Date(user.created_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Última actividad:</span>
                      <p className="mt-1 font-medium">
                        {user.last_sign_in_at ? (
                          format(new Date(user.last_sign_in_at), "MMM dd, HH:mm")
                        ) : (
                          <span className="italic">Nunca</span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No se encontraron usuarios</p>
              <p className="text-xs text-muted-foreground">
                Comienza agregando miembros del equipo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="flex flex-col space-y-4 px-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
        </div>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
              className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
