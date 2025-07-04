import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Clock,
  Circle,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowDown,
  ArrowUpDown,
  ArrowUp,
  AlertTriangle,
  Shield,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from "@/lib/schemas"

// Status tag configuration with semantic colors and accessibility
const statusConfig = {
  pending_approval: {
    label: TICKET_STATUS_LABELS.pending_approval,
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    iconClassName: "text-amber-600 dark:text-amber-400",
    description: "Esperando aprobación del administrador",
  },
  open: {
    label: TICKET_STATUS_LABELS.open,
    icon: Circle,
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    iconClassName: "text-blue-600 dark:text-blue-400",
    description: "Ticket abierto y disponible para trabajar",
  },
  in_progress: {
    label: TICKET_STATUS_LABELS.in_progress,
    icon: Timer,
    className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    iconClassName: "text-purple-600 dark:text-purple-400",
    description: "Ticket en proceso de resolución",
  },
  resolved: {
    label: TICKET_STATUS_LABELS.resolved,
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    description: "Ticket resuelto pero pendiente de cierre",
  },
  closed: {
    label: TICKET_STATUS_LABELS.closed,
    icon: XCircle,
    className: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800",
    iconClassName: "text-slate-600 dark:text-slate-400",
    description: "Ticket completamente cerrado",
  },
} as const

// Priority tag configuration with clear visual hierarchy
const priorityConfig = {
  low: {
    label: TICKET_PRIORITY_LABELS.low,
    icon: ArrowDown,
    className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    iconClassName: "text-green-600 dark:text-green-400",
    description: "Prioridad baja - puede esperar",
    urgencyLevel: 1,
  },
  medium: {
    label: TICKET_PRIORITY_LABELS.medium,
    icon: ArrowUpDown,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
    iconClassName: "text-yellow-600 dark:text-yellow-400",
    description: "Prioridad media - atención normal",
    urgencyLevel: 2,
  },
  high: {
    label: TICKET_PRIORITY_LABELS.high,
    icon: ArrowUp,
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    iconClassName: "text-red-600 dark:text-red-400",
    description: "Prioridad alta - requiere atención inmediata",
    urgencyLevel: 3,
  },
} as const

// Enhanced tag variants with better visual feedback
const tagVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-200 w-fit whitespace-nowrap",
  {
    variants: {
      size: {
        sm: "px-2 py-0.5 text-xs gap-1 [&>svg]:size-3",
        default: "px-2.5 py-1 text-xs gap-1.5 [&>svg]:size-3.5",
        lg: "px-3 py-1.5 text-sm gap-2 [&>svg]:size-4",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-sm hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      interactive: false,
    },
  }
)

// Type definitions
export type TicketStatus = keyof typeof statusConfig
export type TicketPriority = keyof typeof priorityConfig

interface StatusTagProps extends VariantProps<typeof tagVariants> {
  status: TicketStatus
  showLabel?: boolean
  showTooltip?: boolean
  onClick?: () => void
  className?: string
}

interface PriorityTagProps extends VariantProps<typeof tagVariants> {
  priority: TicketPriority
  showLabel?: boolean
  showTooltip?: boolean
  onClick?: () => void
  className?: string
}

// Status Tag Component
export function StatusTag({
  status,
  showLabel = true,
  showTooltip = false,
  onClick,
  size = "default",
  className,
  ...props
}: StatusTagProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const isInteractive = !!onClick

  const tagElement = (
    <div
      className={cn(
        tagVariants({ size, interactive: isInteractive }),
        config.className,
        className
      )}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      title={showTooltip ? config.description : undefined}
      {...props}
    >
      <Icon className={cn("flex-shrink-0", config.iconClassName)} />
      {showLabel && (
        <span className="truncate">{config.label}</span>
      )}
    </div>
  )

  return tagElement
}

// Priority Tag Component
export function PriorityTag({
  priority,
  showLabel = true,
  showTooltip = false,
  onClick,
  size = "default",
  className,
  ...props
}: PriorityTagProps) {
  const config = priorityConfig[priority]
  const Icon = config.icon
  const isInteractive = !!onClick

  const tagElement = (
    <div
      className={cn(
        tagVariants({ size, interactive: isInteractive }),
        config.className,
        className
      )}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      title={showTooltip ? config.description : undefined}
      {...props}
    >
      <Icon className={cn("flex-shrink-0", config.iconClassName)} />
      {showLabel && (
        <span className="truncate">{config.label}</span>
      )}
    </div>
  )

  return tagElement
}

// Combined Tag Component for when you want both status and priority
interface CombinedTagProps {
  status: TicketStatus
  priority: TicketPriority
  layout?: "horizontal" | "vertical"
  size?: VariantProps<typeof tagVariants>["size"]
  showLabels?: boolean
  showTooltips?: boolean
  className?: string
}

export function CombinedTag({
  status,
  priority,
  layout = "horizontal",
  size = "default",
  showLabels = true,
  showTooltips = false,
  className,
}: CombinedTagProps) {
  const wrapperClass = layout === "horizontal" 
    ? "flex items-center gap-2" 
    : "flex flex-col gap-1"

  return (
    <div className={cn(wrapperClass, className)}>
      <StatusTag
        status={status}
        size={size}
        showLabel={showLabels}
        showTooltip={showTooltips}
      />
      <PriorityTag
        priority={priority}
        size={size}
        showLabel={showLabels}
        showTooltip={showTooltips}
      />
    </div>
  )
}

// Status indicator with pulse animation for urgent statuses
export function StatusIndicator({ 
  status, 
  size = "default",
  animated = false 
}: { 
  status: TicketStatus
  size?: "sm" | "default" | "lg"
  animated?: boolean 
}) {
  const config = statusConfig[status]
  const Icon = config.icon
  
  const sizeClasses = {
    sm: "h-3 w-3",
    default: "h-4 w-4", 
    lg: "h-5 w-5"
  }

  const shouldAnimate = animated && (status === "pending_approval" || status === "in_progress")

  return (
    <div className="relative">
      <Icon 
        className={cn(
          sizeClasses[size],
          config.iconClassName,
          shouldAnimate && "animate-pulse"
        )} 
      />
      {shouldAnimate && (
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-20",
          config.iconClassName
        )} />
      )}
    </div>
  )
}

// Priority indicator with visual urgency cues
export function PriorityIndicator({ 
  priority, 
  size = "default",
  showUrgency = false 
}: { 
  priority: TicketPriority
  size?: "sm" | "default" | "lg"
  showUrgency?: boolean 
}) {
  const config = priorityConfig[priority]
  const Icon = config.icon
  
  const sizeClasses = {
    sm: "h-3 w-3",
    default: "h-4 w-4", 
    lg: "h-5 w-5"
  }

  const shouldPulse = showUrgency && priority === "high"

  return (
    <div className="relative">
      <Icon 
        className={cn(
          sizeClasses[size],
          config.iconClassName,
          shouldPulse && "animate-pulse"
        )} 
      />
      {priority === "high" && showUrgency && (
        <AlertTriangle className="absolute -top-1 -right-1 h-2.5 w-2.5 text-red-500" />
      )}
    </div>
  )
}

// Export configurations for advanced usage
export { statusConfig, priorityConfig }

// Utility functions for developers
export const getStatusConfig = (status: TicketStatus) => statusConfig[status]
export const getPriorityConfig = (priority: TicketPriority) => priorityConfig[priority]
export const getPriorityUrgency = (priority: TicketPriority) => priorityConfig[priority].urgencyLevel 