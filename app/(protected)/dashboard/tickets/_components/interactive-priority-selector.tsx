"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Loader2, AlertTriangle, ArrowUp, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { TICKET_PRIORITY_LABELS } from "@/lib/schemas"
import { toast } from "sonner"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Ticket } from "@/lib/schemas"

const priorityOptions = [
  { 
    value: "low", 
    label: "Baja", 
    color: "bg-green-100 text-green-800 border-green-200", 
    icon: Minus,
    iconColor: "text-green-600"
  },
  { 
    value: "medium", 
    label: "Media", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    icon: AlertTriangle,
    iconColor: "text-yellow-600"
  },
  { 
    value: "high", 
    label: "Alta", 
    color: "bg-red-100 text-red-800 border-red-200", 
    icon: ArrowUp,
    iconColor: "text-red-600"
  },
] as const

interface InteractivePrioritySelectorProps {
  ticketId: string
  currentPriority: keyof typeof TICKET_PRIORITY_LABELS
  onPriorityChange?: (newPriority: string) => void
  disabled?: boolean
}

export function InteractivePrioritySelector({
  ticketId,
  currentPriority,
  onPriorityChange,
  disabled = false
}: InteractivePrioritySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [optimisticPriority, setOptimisticPriority] = useState(currentPriority)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Update internal state when prop changes
  useEffect(() => {
    setOptimisticPriority(currentPriority);
  }, [currentPriority]);
  
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Using tRPC mutation with proper pattern
  const { mutate } = useMutation(trpc.tickets.update.mutationOptions({
    onMutate: async (newData) => {
      // Optimistic update
      setIsUpdating(true)
      setOptimisticPriority(newData.priority as keyof typeof TICKET_PRIORITY_LABELS)
      const queryKey = [['tickets', 'getAll'], { type: 'query' }]

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKey,
      })
      
      // Snapshot the previous value
      const previousTickets = queryClient.getQueryData(queryKey)
      
      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (old: Ticket[]) => {
        if (!old) return old
        return old.map((ticket) => 
          ticket.id === ticketId 
            ? { ...ticket, priority: newData.priority }
            : ticket
        )
      })

      return { previousTickets, queryKey }
    },
    onError: (err, newData, context) => {
      // Revert optimistic update on error
      setOptimisticPriority(currentPriority)
      setIsUpdating(false)
      
      if (context?.previousTickets && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousTickets)
      }
      
      toast.error("Error al actualizar la prioridad", {
        description: "No se pudo cambiar la prioridad del ticket. Inténtalo de nuevo.",
      })
    },
    onSuccess: (data) => {
      setIsUpdating(false)
      const newPriority = data.priority as keyof typeof TICKET_PRIORITY_LABELS;
      // setOptimisticPriority(newPriority)
      onPriorityChange?.(newPriority)
      
      toast.success("Prioridad actualizada", {
        description: `La prioridad del ticket ahora es ${TICKET_PRIORITY_LABELS[newPriority].toLowerCase()}`,
        duration: 3000,
      })
    },
    onSettled: (data, context) => {
      // Always refetch after error or success
      // queryClient.invalidateQueries({
      //   queryKey: context?.queryKey,
      // })
    }
  }));

  const handlePriorityChange = (newPriority: string) => {
    if (newPriority === optimisticPriority || disabled || isUpdating) return

    mutate({
      id: ticketId,
      priority: newPriority as keyof typeof TICKET_PRIORITY_LABELS,
    })
    
    setIsOpen(false)
  }

  const currentPriorityOption = priorityOptions.find(option => option.value === optimisticPriority)
  const PriorityIcon = currentPriorityOption?.icon || Minus

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
              currentPriorityOption?.color,
              disabled && "opacity-50 cursor-not-allowed",
              isUpdating && "opacity-75"
            )}
            disabled={disabled || isUpdating}
          >
            <div className="flex items-center gap-2">
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <PriorityIcon className={cn(
                  "h-3 w-3",
                  currentPriorityOption?.iconColor?.replace('600', '700')
                )} />
              )}
              <span className="truncate font-medium">
                {TICKET_PRIORITY_LABELS[optimisticPriority]}
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
            "w-48 p-1.5 min-w-[180px]",
            "backdrop-blur-xl bg-background/60",
            "animate-in fade-in-0 zoom-in-95 duration-100"
          )}
        >
          {priorityOptions.map((option) => {
            const OptionIcon = option.icon
            
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handlePriorityChange(option.value)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer",
                  "transition-colors duration-100",
                  option.value === optimisticPriority && "bg-accent/10"
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-5 w-5 rounded-md bg-background/40 border border-border/30 flex items-center justify-center">
                    <OptionIcon className={cn(
                      "h-3 w-3",
                      option.iconColor?.replace('600', '700')
                    )} />
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
                
                {option.value === optimisticPriority && (
                  <Check className="h-4 w-4 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
