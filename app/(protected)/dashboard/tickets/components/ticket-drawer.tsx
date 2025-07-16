 "use client"

import * as React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { 
  Activity, 
  ArrowRight,
  ArrowUpDown, 
  Building, 
  Calendar, 
  Camera, 
  CheckCircle, 
  Clock,
  Edit,
  FileText, 
  Loader2, 
  MessageSquare, 
  MoreHorizontal, 
  Plus, 
  RefreshCw, 
  Save,
  Send, 
  Tag, 
  User, 
  UserCheck,
  X
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

import { cn } from "@/lib/utils"
import { cleanUserName } from "@/lib/utils"
import { 
  TICKET_STATUS_LABELS, 
  TICKET_PRIORITY_LABELS, 
  TICKET_SOURCE_LABELS 
} from "@/lib/schemas/ticket"
import { TicketListItem } from "@/trpc/api/routers/tickets"

interface TicketDrawerProps {
  ticket: TicketListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SerialNumberInput {
  tag: string
  description: string
}

interface Comment {
  id: string
  user_name: string
  message: string
  created_at: string
  user_role: 'admin' | 'technician' | 'client'
}

// Define history item type that matches what comes from the API
interface TicketHistoryItem {
  id: string
  type: string
  description: string
  created_at: string
  user?: {
    id: string
    name: string
  }
  from_value?: string
  to_value?: string
}

export function TicketDrawer({ ticket, open, onOpenChange }: TicketDrawerProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [updatedTicket, setUpdatedTicket] = useState({
    status: ticket?.status || '',
    priority: ticket?.priority || '',
    assigned_user_id: ticket?.assigned_user?.id || null
  })
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false)
  const [newSerialNumber, setNewSerialNumber] = useState<SerialNumberInput>({ tag: '', description: '' })
  const [isAddingSerialNumber, setIsAddingSerialNumber] = useState(false)
  
  const trpc = useTRPC()
  
  // Fetch ticket updates/comments
  const { data: ticketWithUpdates, refetch } = useQuery({
    ...trpc.tickets.getById.queryOptions({ id: ticket?.id || '' }),
    enabled: !!ticket?.id && open,
    refetchOnWindowFocus: false
  })
  
  // Extract ticket history from the detailed ticket data
  const ticketHistory = ticketWithUpdates?.ticket_history || []
  
  // Fetch users for dropdown
  const { data: users } = useQuery({
    ...trpc.users.list.queryOptions(),
    enabled: isEditing,
    refetchOnWindowFocus: false
  })

  // Add comment mutation
  const { mutateAsync: addComment } = useMutation({
    mutationFn: (data: { id: string; comment: string }) => {
      return fetch('/api/trpc/tickets.update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: data })
      }).then(res => res.json())
    },
    onSuccess: () => {
      toast.success("Comentario agregado exitosamente")
      setNewComment("")
      refetch()
    },
    onError: (error: Error) => {
      toast.error("Error al agregar comentario: " + error.message)
    }
  })
  
  // Update ticket mutation
  const { mutateAsync: updateTicket } = useMutation({
    mutationFn: (data: { id: string; status?: string; priority?: string; assigned_user_id?: string | null }) => {
      return fetch('/api/trpc/tickets.update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: data })
      }).then(res => res.json())
    },
    onSuccess: () => {
      toast.success("Ticket actualizado exitosamente")
      setIsEditing(false)
      setIsUpdatingTicket(false)
      refetch()
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar ticket: " + error.message)
      setIsUpdatingTicket(false)
    }
  })
  
  // Add serial number mutation
  const { mutateAsync: addSerialNumber } = useMutation({
    mutationFn: (data: { id: string; serial_number: SerialNumberInput }) => {
      return fetch('/api/trpc/tickets.update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: data })
      }).then(res => res.json())
    },
    onSuccess: () => {
      toast.success("Número de serie agregado exitosamente")
      setNewSerialNumber({ tag: '', description: '' })
      refetch()
    },
    onError: (error: Error) => {
      toast.error("Error al agregar número de serie: " + error.message)
    }
  })
  
  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!ticket?.id || !newComment.trim()) return
    
    try {
      setIsSubmittingComment(true)
      await addComment({ id: ticket.id, comment: newComment.trim() })
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setIsSubmittingComment(false)
    }
  }
  
  // Handle ticket update
  const handleUpdateTicket = async () => {
    if (!ticket?.id) return
    
    try {
      setIsUpdatingTicket(true)
      await updateTicket({
        id: ticket.id,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        assigned_user_id: updatedTicket.assigned_user_id
      })
    } catch (error) {
      console.error("Error updating ticket:", error)
    }
  }
  
  // Handle adding serial number
  const handleAddSerialNumber = async () => {
    if (!ticket?.id || !newSerialNumber.tag.trim()) return
    
    try {
      setIsAddingSerialNumber(true)
      await addSerialNumber({
        id: ticket.id,
        serial_number: {
          tag: newSerialNumber.tag.trim(),
          description: newSerialNumber.description.trim()
        }
      })
    } catch (error) {
      console.error("Error adding serial number:", error)
    } finally {
      setIsAddingSerialNumber(false)
    }
  }
  
  // Reset form when ticket changes
  React.useEffect(() => {
    if (ticket) {
      setUpdatedTicket({
        status: ticket.status || '',
        priority: ticket.priority || '',
        assigned_user_id: ticket.assigned_user?.id || null
      })
      setNewComment("")
      setNewSerialNumber({ tag: '', description: '' })
      setIsEditing(false)
    }
  }, [ticket])
  
  // Helper function to get badge variant for status
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'open':
        return "default"
      case 'in_progress':
        return "secondary"
      case 'closed':
        return "outline"
      default:
        return "outline"
    }
  }
  
  // Helper function to get badge variant for priority
  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'high':
        return "destructive"
      case 'medium':
        return "secondary"
      case 'low':
        return "outline"
      default:
        return "outline"
    }
  }

  if (!ticket) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[800px] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-6 pb-4">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-bold">
                  {ticket.title}
                </SheetTitle>
                <div className="text-sm text-muted-foreground">
                  Ticket #{ticket.id}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(false)}
                      disabled={isUpdatingTicket}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleUpdateTicket}
                      disabled={isUpdatingTicket}
                    >
                      {isUpdatingTicket ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>
        </div>
        {/* Main content */}
        <div className="p-6 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Detalles del Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select 
                      value={updatedTicket.status} 
                      onValueChange={(value) => setUpdatedTicket({...updatedTicket, status: value})}
                      disabled={isUpdatingTicket}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
              Historial de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timeline stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border rounded-lg p-4 text-center hover:bg-muted/20 transition-colors">
                <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Historial de Actividad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timeline stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="border rounded-lg p-4 text-center hover:bg-muted/20 transition-colors">
                    <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-lg font-bold">{ticketHistory.length}</p>
                    <p className="text-xs text-muted-foreground">Eventos</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center hover:bg-muted/20 transition-colors">
                    <div className="bg-orange-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-lg font-bold">
                      {ticket.status === 'closed' 
                        ? Math.ceil((new Date(ticket.updated_at).getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60 * 24))
                        : Math.ceil((new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60 * 24))
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Días {ticket.status === 'closed' ? 'de duración' : 'abierto'}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 text-center hover:bg-muted/20 transition-colors">
                    <div className="bg-green-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-lg font-bold">{TICKET_STATUS_LABELS[ticket.status as keyof typeof TICKET_STATUS_LABELS]}</p>
                    <p className="text-xs text-muted-foreground">Estado actual</p>
                  </div>
                </div>
                
                {/* Timeline events */}
                {ticketHistory.length > 0 ? (
                  <div className="space-y-4">
                    {ticketHistory.map((historyItem: TicketHistoryItem, index) => {
                      // Determine icon and color based on history type
                      let icon = <Activity className="h-4 w-4" />;
                      let bgColor = "bg-blue-50";
                      let textColor = "text-blue-600";
                      
                      if (historyItem.type === 'status_change') {
                        icon = <RefreshCw className="h-4 w-4" />;
                        bgColor = "bg-amber-50";
                        textColor = "text-amber-600";
                      } else if (historyItem.type === 'priority_change') {
                        icon = <ArrowUpDown className="h-4 w-4" />;
                        bgColor = "bg-indigo-50";
                        textColor = "text-indigo-600";
                      } else if (historyItem.type === 'comment_added') {
                        icon = <MessageSquare className="h-4 w-4" />;
                        bgColor = "bg-green-50";
                        textColor = "text-green-600";
                      } else if (historyItem.type === 'assignment_change') {
                        icon = <UserCheck className="h-4 w-4" />;
                        bgColor = "bg-purple-50";
                        textColor = "text-purple-600";
                      }
                      
                      return (
                        <div key={historyItem.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={cn("p-2 rounded-full", bgColor)}>
                              <div className={textColor}>{icon}</div>
                            </div>
                            {index < ticketHistory.length - 1 && (
                              <div className="w-0.5 bg-border grow mt-2"></div>
                            )}
                          </div>
                          <div className="space-y-1 pb-4">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{historyItem.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <p className="text-xs text-muted-foreground">{cleanUserName(historyItem.user?.name || 'Sistema')}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(historyItem.created_at), "dd/MM/yyyy • HH:mm")}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay historial de actividad</p>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
} 