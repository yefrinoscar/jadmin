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
import { Plus, X, Building2, Users, Tags } from "lucide-react"

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
import { Card, CardContent } from "@/components/ui/card"
import { clientColumns } from "./client-columns"
import { Database } from "@/lib/database.types"

type Client = Database["public"]["Tables"]["clients"]["Row"]

interface ClientWithStats extends Client {
  service_tags_count: number
  active_tickets_count: number
}

interface ClientsTableProps {
  data: ClientWithStats[]
}

export function ClientsTable({ data }: ClientsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [showPinnedShadow, setShowPinnedShadow] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const table = useReactTable({
    data,
    columns: clientColumns,
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
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

  // Check for scrollable content on mount and data change
  React.useEffect(() => {
    handleScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, data])

  const handleRowClick = (client: ClientWithStats, event: React.MouseEvent) => {
    // Don't open detail if clicking on checkbox, buttons, or other interactive elements
    const target = event.target as HTMLElement
    if (target.closest('button, input, [role="button"]')) {
      return
    }
    
    // TODO: Implement client detail drawer
    console.log('Open client detail:', client.id)
  }

  // Calculate stats
  const totalClients = data.length
  const totalServiceTags = data.reduce((acc, client) => acc + client.service_tags_count, 0)
  const totalActiveTickets = data.reduce((acc, client) => acc + client.active_tickets_count, 0)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Tags className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Etiquetas de Servicio</p>
                <p className="text-2xl font-bold">{totalServiceTags}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets Activos</p>
                <p className="text-2xl font-bold">{totalActiveTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-1 flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
          <Input
            placeholder="Buscar por empresa..."
            value={(table.getColumn("company_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("company_name")?.setFilterValue(event.target.value)
            }
            className="h-8 w-full md:w-[180px] lg:w-[250px]"
          />
          <Input
            placeholder="Buscar por contacto..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="h-8 w-full md:w-[150px] lg:w-[200px]"
          />
          <Input
            placeholder="Buscar por email..."
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("email")?.setFilterValue(event.target.value)
            }
            className="h-8 w-full md:w-[150px] lg:w-[200px]"
          />
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
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-8 hidden md:flex">
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
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
          <Button size="sm" className="h-8">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div 
          ref={scrollContainerRef}
          className="overflow-auto"
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={header.column.id === 'select' || header.column.id === 'id' ? 
                          `sticky left-0 bg-background z-10 ${showPinnedShadow ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}` : 
                          ''
                        }
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
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e) => handleRowClick(row.original, e)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={cell.column.id === 'select' || cell.column.id === 'id' ? 
                          `sticky left-0 bg-background z-10 ${showPinnedShadow ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}` : 
                          ''
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={clientColumns.length}
                    className="h-24 text-center"
                  >
                    No se encontraron clientes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
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
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              {"<<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              {"<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              {">"}
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              {">>"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 