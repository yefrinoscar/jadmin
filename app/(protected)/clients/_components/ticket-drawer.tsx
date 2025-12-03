"use client"

import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { useAuth } from "@clerk/nextjs"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  Calendar,
  MessageSquare,
  Send,
  Loader2,
  FileText
} from "lucide-react"

import { 
  TicketHeader, 
  TicketDetails, 
  TicketHistory
} from "../../dashboard/tickets/_components/details"

interface TicketDrawerProps {
  ticket: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TicketDrawer({ ticket, open, onOpenChange }: TicketDrawerProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { userId } = useAuth()

  // Get ticket comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({ 
    ...trpc.comments.getByTicketId.queryOptions({ ticket_id: ticket?.id || '' }), 
    enabled: !!ticket?.id && open 
  })
  
  // Get ticket history
  const { data: history = [], isLoading: historyLoading } = useQuery({ 
    ...trpc.tickets.getTicketHistory.queryOptions({ id: ticket?.id || '' }), 
    enabled: !!ticket?.id && open 
  })

  // Fetch users for display
  const { data: users = [] } = useQuery(trpc.users.getAll.queryOptions())

  // Add comment mutation
  const { mutateAsync: addComment } = useMutation(trpc.comments.add.mutationOptions({
    onSuccess: () => {
      toast.success("Comentario agregado exitosamente")
      setNewComment("")
      setIsSubmittingComment(false)
    },
    onError: (error: any) => {
      toast.error(`Error al agregar comentario: ${error.message}`)
      setIsSubmittingComment(false)
    }
  }))

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return
    
    setIsSubmittingComment(true)
    try {
      await addComment({
        ticket_id: ticket?.id || '',
        content: newComment.trim(),
      })


      queryClient.invalidateQueries(trpc.comments.getByTicketId.queryOptions({ ticket_id: ticket?.id || '' }))
    } catch (error) {
      console.error('Error submitting comment:', error)
    }
  }

  if (!ticket) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
        {/* Header */}
        <TicketHeader ticket={ticket} />
        
        {/* Fixed Details Section */}
        <TicketDetails ticket={ticket} users={users} />
        
        {/* Tabs for details, comments, history */}
        <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4 text-xs">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="comments">Comentarios</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 px-6 mt-0">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Números de Serie</h4>
                {ticket.ticket_service_tags && ticket.ticket_service_tags.length > 0 ? (
                  <div className="space-y-2">
                    {ticket.ticket_service_tags.map((serviceTag: any) => (
                      <div key={serviceTag.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {serviceTag.service_tag.tag}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{serviceTag.service_tag.description}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          <span>Tipo: {serviceTag.service_tag.hardware_type}</span>
                          {serviceTag.service_tag.location && (
                            <span className="ml-2">• Ubicación: {serviceTag.service_tag.location}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay números de serie asociados</p>
                )}
              </div>
              
              {/* Show ticket photos if available */}
              {ticket.photo_urls && ticket.photo_urls.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Imágenes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {ticket.photo_urls.map((url: string, index: number) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="comments" className="space-y-4 px-6 mt-0">
            {/* Comments List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-600">Cargando comentarios...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No hay comentarios aún</p>
                </div>
              ) : (
                comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {comment.user_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{comment.user_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {comment.user_role === 'admin' ? 'Admin' : 
                           comment.user_role === 'technician' ? 'Técnico' : 'Cliente'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      {comment.photo_urls && comment.photo_urls.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {comment.photo_urls.map((url: string, index: number) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Adjunto ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <Separator />

            {/* Comment Input */}
            <div className="space-y-3">
              <Textarea
                placeholder="Escribe tu comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isSubmittingComment}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmittingComment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Comentario
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 px-6 mt-0">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-600">Cargando historial...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No hay historial disponible</p>
                </div>
              ) : (
                history.map((item: any, index: number) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                        {item.user_name && ` • ${item.user_name}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
