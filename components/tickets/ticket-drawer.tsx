 "use client"

import * as React from "react"
import { useState } from "react"
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusTag, PriorityTag } from "@/components/ui/status-tags"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Calendar,
  User,
  Tag,
  Mail,
  Phone,
  Globe,
  Users,
  Edit,
  MoreHorizontal,
  MessageSquare,
  Clock,
  Building,
  FileText,
  Activity,
  Image,
  Send,
  Camera,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertCircle,
  ArrowRight
} from "lucide-react"
import { cn, cleanUserName } from "@/lib/utils"
import { 
  TicketWithRelations, 
  ServiceTag,
  TICKET_STATUS_LABELS, 
  TICKET_PRIORITY_LABELS, 
  TICKET_SOURCE_LABELS 
} from "@/lib/schemas/ticket"
import { format } from "date-fns"
import { trpc } from "@/components/providers/trpc-provider"
import { toast } from "sonner"

interface TicketDrawerProps {
  ticket: TicketWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Comment {
  id: string
  user_name: string
  message: string
  created_at: string
  user_role: 'admin' | 'technician' | 'client'
}

interface HistoryEvent {
  id: string
  type: 'created' | 'status_change' | 'assignment' | 'approval' | 'closed' | 'comment'
  timestamp: string
  user?: string
  fromValue?: string
  toValue?: string
  description: string
}

export function TicketDrawer({ ticket, open, onOpenChange }: TicketDrawerProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Fetch ticket updates/comments
  const { data: ticketWithUpdates, refetch } = trpc.tickets.getById.useQuery(
    { id: ticket?.id || '' },
    { 
      enabled: !!ticket?.id && open,
      refetchOnWindowFocus: false
    }
  )

  // Add comment mutation
  const addCommentMutation = trpc.tickets.addUpdate.useMutation({
    onSuccess: () => {
      toast.success("Comentario agregado exitosamente")
      setNewComment("")
      refetch()
    },
    onError: (error) => {
      toast.error("Error al agregar comentario: " + error.message)
    }
  })

  if (!ticket) return null

  const sourceConfig = {
    email: { label: TICKET_SOURCE_LABELS.email, icon: Mail, variant: "secondary" as const },
    phone: { label: TICKET_SOURCE_LABELS.phone, icon: Phone, variant: "default" as const },
    web: { label: TICKET_SOURCE_LABELS.web, icon: Globe, variant: "outline" as const },
    in_person: { label: TICKET_SOURCE_LABELS.in_person, icon: Users, variant: "destructive" as const },
  }

  const sourceConf = sourceConfig[ticket.source as keyof typeof sourceConfig]
  const SourceIcon = sourceConf.icon

  // Get user names
  const reportedUserName = ticket.reported_user?.name || ticket.reported_by || 'Usuario Desconocido'
  const assignedUserName = ticket.assigned_user?.name || ticket.reported_user?.name || reportedUserName
  const isAutoAssigned = !ticket.assigned_to && ticket.reported_by

  // Mock comments (in real app, would come from API)
  const comments: Comment[] = [
    {
      id: '1',
      user_name: 'Juan Pérez',
      message: 'He revisado el problema inicial. Necesitamos más información sobre el error específico.',
      created_at: '2024-01-15T10:30:00Z',
      user_role: 'technician'
    },
    {
      id: '2', 
      user_name: 'María García',
      message: 'El problema se presenta cuando intentamos acceder al módulo de reportes. Adjunto captura de pantalla.',
      created_at: '2024-01-15T14:15:00Z',
      user_role: 'client'
    }
  ]

  // Generate history events
  const historyEvents: HistoryEvent[] = [
    {
      id: '1',
      type: 'created' as const,
      timestamp: ticket.created_at,
      user: reportedUserName,
      description: `Ticket creado via ${TICKET_SOURCE_LABELS[ticket.source as keyof typeof TICKET_SOURCE_LABELS]}`
    },
    ...(ticket.assigned_to ? [{
      id: '2',
      type: 'assignment' as const,
      timestamp: ticket.created_at,
      user: 'Sistema',
      toValue: assignedUserName,
      description: `Asignado a ${assignedUserName}`
    }] : []),
    ...(ticket.approved_by && ticket.approved_at ? [{
      id: '3',
      type: 'approval' as const,
      timestamp: ticket.approved_at,
      user: ticket.approved_by,
      description: `Ticket aprobado`
    }] : []),
    ...(ticket.status !== 'pending_approval' ? [{
      id: '4',
      type: 'status_change' as const,
      timestamp: ticket.time_open || ticket.updated_at,
      user: assignedUserName || 'Sistema',
      fromValue: 'pending_approval',
      toValue: ticket.status,
      description: `Estado cambiado de pendiente a ${TICKET_STATUS_LABELS[ticket.status as keyof typeof TICKET_STATUS_LABELS]}`
    }] : []),
    ...(ticket.time_closed ? [{
      id: '5',
      type: 'closed' as const,
      timestamp: ticket.time_closed,
      user: assignedUserName || 'Sistema',
      description: `Ticket cerrado`
    }] : [])
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const getEventIcon = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'created': return FileText
      case 'status_change': return Activity
      case 'assignment': return UserCheck
      case 'approval': return CheckCircle
      case 'closed': return XCircle
      case 'comment': return MessageSquare
      default: return Clock
    }
  }

  const getEventColor = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'created': return 'text-blue-600 bg-blue-100'
      case 'status_change': return 'text-purple-600 bg-purple-100'
      case 'assignment': return 'text-orange-600 bg-orange-100'
      case 'approval': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
      case 'comment': return 'text-indigo-600 bg-indigo-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    
    setIsSubmittingComment(true)
    try {
      // Here you would call your API to submit the comment
      // await submitComment(ticket.id, newComment)
      
      // For now, just clear the textarea
      setNewComment("")
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[800px] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-6 pb-4">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl font-bold">{ticket.id}</SheetTitle>
                <SheetDescription className="text-base font-medium text-foreground mt-1">
                  {ticket.title}
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Cambiar prioridad</DropdownMenuItem>
                    <DropdownMenuItem>Cambiar estado</DropdownMenuItem>
                    <DropdownMenuItem>Reasignar ticket</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Eliminar ticket</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Status Badges */}
            <div className="flex gap-2 flex-wrap">
              <StatusTag 
                status={ticket.status as keyof typeof TICKET_STATUS_LABELS}
                size="sm"
              />
              <PriorityTag 
                priority={ticket.priority as keyof typeof TICKET_PRIORITY_LABELS}
                size="sm"
              />
              <Badge variant={sourceConf.variant} className="text-xs">
                <SourceIcon className="w-3 h-3 mr-1" />
                {sourceConf.label}
              </Badge>
            </div>
          </SheetHeader>
        </div>

        {/* Tabs Content */}
        <div className="p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Detalles
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Historia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="p-6 space-y-8">
              {/* Header Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Creado por</p>
                      <p className="font-semibold text-sm">{cleanUserName(reportedUserName)}</p>
                      <p className="text-xs text-muted-foreground">{TICKET_SOURCE_LABELS[ticket.source as keyof typeof TICKET_SOURCE_LABELS]}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-2 rounded-lg">
                      <UserCheck className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Asignado a</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{cleanUserName(assignedUserName)}</p>
                        {isAutoAssigned && <Badge variant="outline" className="text-xs">Auto</Badge>}
                      </div>
                    </div>
                  </div>
                </div>

                {ticket.client_company_name && (
                  <div className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-50 p-2 rounded-lg">
                        <Building className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Cliente</p>
                        <p className="font-semibold text-sm">{ticket.client_company_name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Creado</p>
                    <p className="text-sm font-medium">{format(new Date(ticket.created_at), "dd/MM/yyyy • HH:mm")}</p>
                  </div>
                </div>
                {ticket.time_closed && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cerrado</p>
                      <p className="text-sm font-medium">{format(new Date(ticket.time_closed), "dd/MM/yyyy • HH:mm")}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Descripción del Problema</h3>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm leading-relaxed text-foreground bg-muted/20 rounded-lg p-4 border">
                    {ticket.description}
                  </p>
                </div>
                
                {/* Photo */}
                {ticket.photo_url && (
                  <div className="mt-4">
                    <img 
                      src={ticket.photo_url} 
                      alt="Foto del problema" 
                      className="max-w-sm rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Service Tags */}
              {ticket.service_tags && ticket.service_tags.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Service Tags</h3>
                    </div>
                    <Badge variant="secondary">{ticket.service_tags.length} tags</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ticket.service_tags.map((serviceTag: ServiceTag, index: number) => (
                      <div key={serviceTag.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                              {serviceTag.tag}
                            </code>
                            {serviceTag.hardware_type && (
                              <Badge variant="outline" className="text-xs">
                                {serviceTag.hardware_type}
                              </Badge>
                            )}
                          </div>
                          
                          {serviceTag.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {serviceTag.description}
                            </p>
                          )}
                          
                          {serviceTag.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span>{serviceTag.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Comentarios</h3>
                  </div>
                  <Badge variant="secondary">{comments.length}</Badge>
                </div>

                {/* Add Comment */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Escribe un comentario..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[80px] resize-none border-0 bg-background shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pl-11">
                      <Button variant="ghost" size="sm" className="text-muted-foreground h-8">
                        <Camera className="h-4 w-4 mr-2" />
                        Adjuntar
                      </Button>
                      <Button 
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                        size="sm"
                        className="h-8"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isSubmittingComment ? 'Enviando...' : 'Comentar'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay comentarios</p>
                    </div>
                  ) : (
                    comments.map((comment, index) => (
                      <div key={comment.id} className="bg-muted/20 rounded-lg p-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {comment.user_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.user_name}</span>
                              <Badge 
                                variant={comment.user_role === 'admin' ? 'default' : 'secondary'} 
                                className="text-xs h-5"
                              >
                                {comment.user_role === 'admin' ? 'Admin' : 
                                 comment.user_role === 'technician' ? 'Técnico' : 'Cliente'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), "dd/MM • HH:mm")}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">{comment.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="p-6 space-y-6">
              {/* Header with Stats */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Cronología del Ticket</h3>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center hover:bg-muted/20 transition-colors">
                    <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-lg font-bold">{historyEvents.length}</p>
                    <p className="text-xs text-muted-foreground">Eventos</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center hover:bg-muted/20 transition-colors">
                    <div className="bg-orange-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-lg font-bold">
                      {ticket.time_closed 
                        ? Math.ceil((new Date(ticket.time_closed).getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60 * 24))
                        : Math.ceil((new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60 * 24))
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Días {ticket.time_closed ? 'de duración' : 'abierto'}
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
              </div>
              
              {/* Timeline */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Actividad reciente</h4>
                
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-border via-border to-transparent"></div>
                  
                  <div className="space-y-6">
                    {historyEvents.map((event, index) => {
                      const EventIcon = getEventIcon(event.type)
                      const colorClasses = getEventColor(event.type)
                      
                      return (
                        <div key={event.id} className="relative flex items-start gap-4">
                          {/* Timeline dot */}
                          <div className={cn(
                            "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-background shadow-sm",
                            colorClasses
                          )}>
                            <EventIcon className="h-5 w-5" />
                          </div>
                          
                          {/* Event content */}
                          <div className="flex-1 min-w-0 pb-4">
                            <div className="border rounded-lg p-4 bg-card hover:bg-muted/20 transition-colors">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <h5 className="font-medium text-sm mb-1">
                                    {event.description}
                                  </h5>
                                  
                                  {event.fromValue && event.toValue && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                        {TICKET_STATUS_LABELS[event.fromValue as keyof typeof TICKET_STATUS_LABELS] || event.fromValue}
                                      </Badge>
                                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        {TICKET_STATUS_LABELS[event.toValue as keyof typeof TICKET_STATUS_LABELS] || event.toValue}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(event.timestamp), "dd MMM yyyy")}
                                  </p>
                                  <p className="text-xs font-medium">
                                    {format(new Date(event.timestamp), "HH:mm")}
                                  </p>
                                </div>
                              </div>
                              
                              {event.user && (
                                <div className="flex items-center gap-2 pt-2 border-t">
                                  <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-semibold">
                                      {event.user.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {event.user}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
} 