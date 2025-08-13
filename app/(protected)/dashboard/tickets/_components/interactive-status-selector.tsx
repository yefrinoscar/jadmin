"use client"

import { useState } from "react"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useTRPC } from "@/trpc/client"
import { cn } from "@/lib/utils"
import { TICKET_STATUS_LABELS, TICKET_STATUS_TABLE_LABELS } from "@/lib/schemas"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Ticket } from "@/lib/schemas"

const statusOptions = [
  { value: "pending_approval", label: "Pendiente de Aprobación", color: "bg-orange-100 text-orange-800 border-orange-200", dotColor: "bg-orange-500" },
  { value: "open", label: "Abierto", color: "bg-blue-100 text-blue-800 border-blue-200", dotColor: "bg-blue-500" },
  { value: "in_progress", label: "En Progreso", color: "bg-yellow-100 text-yellow-800 border-yellow-200", dotColor: "bg-yellow-500" },
  { value: "resolved", label: "Resuelto", color: "bg-green-100 text-green-800 border-green-200", dotColor: "bg-green-500" },
  { value: "closed", label: "Cerrado", color: "bg-gray-100 text-gray-800 border-gray-200", dotColor: "bg-gray-500" },
] as const

interface InteractiveStatusSelectorProps {
  ticketId: string
  currentStatus: keyof typeof TICKET_STATUS_LABELS
  onStatusChange?: (newStatus: string) => void
  disabled?: boolean
}

export function InteractiveStatusSelector({
  ticketId,
  currentStatus,
  onStatusChange,
  disabled = false
}: InteractiveStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  // Using tRPC mutation with proper pattern
  const { mutate } = useMutation(trpc.tickets.update.mutationOptions({
    onMutate: async (newData) => {
      // Optimistic update
      setIsUpdating(true)
      setOptimisticStatus(newData.status as keyof typeof TICKET_STATUS_LABELS)
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["tickets", "all"],
      })
      
      // Snapshot the previous value
      const previousTickets = queryClient.getQueryData(["tickets", "all"])
      
      // Update the cache with optimistic data
      queryClient.setQueryData(["tickets", "all"], (oldData: any) => {
        if (!oldData) return oldData
        
        // Handle both array and paginated data structures
        if (Array.isArray(oldData)) {
          return oldData.map((ticket: Ticket) => 
            ticket.id === newData.id 
              ? { ...ticket, status: newData.status as Ticket['status'] }
              : ticket
          )
        } else if (oldData.pages) {
          // Handle paginated data
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((ticket: Ticket) =>
                ticket.id === newData.id
                  ? { ...ticket, status: newData.status as Ticket['status'] }
                  : ticket
              ),
            })),
          }
        }
        
        return oldData
      })

      return { previousTickets }
    },
    onError: (error, newData, context: any) => {
      // Revert optimistic update on error
      setOptimisticStatus(currentStatus)
      setIsUpdating(false)
      
      if (context?.previousTickets) {
        queryClient.setQueryData(["tickets", "all"], context.previousTickets)
      }
      
      toast.error(`Error al actualizar estado: ${error.message}`)
    },
    onSuccess: (data) => {
      setIsUpdating(false)
      onStatusChange?.(data.status)
      
      toast.success("Estado actualizado exitosamente", {
        description: `El ticket ahora está ${TICKET_STATUS_LABELS[data.status as keyof typeof TICKET_STATUS_LABELS].toLowerCase()}`,
      })
    },
    onSettled: () => {
      // Always refetch after error or success
      void queryClient.invalidateQueries({
        queryKey: ["tickets", "all"]
      })
    }
  }));

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === optimisticStatus || disabled || isUpdating) return

    mutate({
      id: ticketId,
      status: newStatus as keyof typeof TICKET_STATUS_LABELS,
    })
    
    setIsOpen(false)
  }

  const currentStatusOption = statusOptions.find(option => option.value === optimisticStatus)

  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-3 text-xs font-medium rounded-full border border-transparent",
              "hover:border-current/20 hover:brightness-110",
              "transition-all duration-150 ease-out",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isOpen && "border-current/20 brightness-110",
              currentStatusOption?.color,
              disabled && "opacity-50 cursor-not-allowed",
              isUpdating && "opacity-75"
            )}
            disabled={disabled || isUpdating}
          >
            <div className="flex items-center gap-2">
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  currentStatusOption?.dotColor
                )} />
              )}
              <span className="truncate font-medium">
                {TICKET_STATUS_TABLE_LABELS[optimisticStatus]}
              </span>
              <ChevronDown className={cn(
                "h-3 w-3 transition-transform duration-300 opacity-60",
                isOpen && "rotate-180"
              )} />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="start" 
          className={cn(
            "w-52 p-1.5 min-w-[200px]",
            "backdrop-blur-xl bg-background/60",
            "animate-in fade-in-0 zoom-in-95 duration-100"
          )}
        >
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer",
                "transition-colors duration-100",
                option.value === optimisticStatus && "bg-accent/10"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="h-5 w-5 rounded-md bg-background/40 border border-border/30 flex items-center justify-center">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    option.dotColor
                  )} />
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </div>
              
              {option.value === optimisticStatus && (
                <Check className="h-4 w-4 text-muted-foreground" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
