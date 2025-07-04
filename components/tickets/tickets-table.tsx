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
import { Plus, X } from "lucide-react"

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
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { TicketDrawer } from "./ticket-drawer"
import { ticketColumns } from "./ticket-columns"
import { Ticket, ticketStatuses, ticketPriorities, ticketSources } from "@/lib/types/ticket"
import { format } from "date-fns"

interface TicketsTableProps {
  data: Ticket[]
}

export function TicketsTable({ data }: TicketsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = React.useState(false)

  const table = useReactTable({
    data,
    columns: ticketColumns,
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

  const handleRowClick = (ticket: Ticket, event: React.MouseEvent) => {
    // Don't open drawer if clicking on checkbox, buttons, or other interactive elements
    const target = event.target as HTMLElement
    if (target.closest('button, input, [role="button"]')) {
      return
    }
    
    setSelectedTicket(ticket)
    setIsDetailDrawerOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-1 flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
          <Input
            placeholder="Buscar descripciones..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="h-8 w-full md:w-[150px] lg:w-[250px]"
          />
          <div className="flex space-x-2">
            <Input
              placeholder="Filtrar etiquetas..."
              value={(table.getColumn("service_tag_id")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("service_tag_id")?.setFilterValue(event.target.value)
              }
              className="h-8 w-full md:w-[120px] lg:w-[150px]"
            />
            {table.getColumn("status") && (
              <DataTableFacetedFilter
                column={table.getColumn("status")}
                title="Estado"
                options={ticketStatuses}
              />
            )}
            {table.getColumn("priority") && (
              <DataTableFacetedFilter
                column={table.getColumn("priority")}
                title="Prioridad"
                options={ticketPriorities}
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
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
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
            Add Task
          </Button>
        </div>
      </div>
      {/* Desktop Table */}
      <div className="flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup: any) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => {
                    return (
                      <TableHead key={header.id} className="text-xs font-medium whitespace-nowrap">
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
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: any) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={(event) => handleRowClick(row.original, event)}
                  >
                    {row.getVisibleCells().map((cell: any) => (
                      <TableCell key={cell.id} className="text-sm whitespace-nowrap">
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
                    colSpan={ticketColumns.length}
                    className="h-16 text-center text-sm"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row: any) => {
            const ticket = row.original;
            return (
              <Card 
                key={row.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={(event) => handleRowClick(ticket, event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm leading-tight">{ticket.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">#{ticket.id}</p>
                    </div>
                    <Badge 
                      variant={ticket.priority === 'critical' ? 'destructive' : 
                              ticket.priority === 'high' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ticket.priority}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Estado:</span>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Asignado:</span>
                      <p className="mt-1 font-medium">{ticket.assigned_to?.name || 'Sin asignar'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cliente:</span>
                      <p className="mt-1 font-medium">{ticket.clients?.company_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Etiqueta:</span>
                      <p className="mt-1 font-medium">{ticket.service_tags?.tag}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    Creado: {format(new Date(ticket.created_at), "MMM dd, yyyy")}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No se encontraron tickets</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="flex flex-col space-y-4 px-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
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
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              ⟨⟨
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              ⟨
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              ⟩
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              ⟩⟩
            </Button>
          </div>
        </div>
      </div>

      <TicketDrawer 
        ticket={selectedTicket}
        open={isDetailDrawerOpen}
        onOpenChange={setIsDetailDrawerOpen}
      />
    </div>
  )
} 