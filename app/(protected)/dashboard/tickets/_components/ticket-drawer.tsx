"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { makeQueryClient } from "@/trpc/query-client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { TicketListItem } from "@/trpc/api/routers/tickets"
import { 
  TicketHeader, 
  TicketDetails, 
  SerialNumbers, 
  TicketComments, 
  TicketHistory 
} from "./details"

interface TicketDrawerProps {
  ticket: TicketListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SerialNumberInput {
  id: string
  tag: string
  description: string
  hardware_type: string
  location: string
}

interface Comment {
  id: string
  user_name: string
  content: string
  created_at: string
  user_role: 'admin' | 'technician' | 'client'
  photo_urls?: string[] | null
}

// Define history item type that matches what comes from the API
interface TicketHistoryItem {
  type: string
  description: string
  timestamp: string
  user?: {
    id: string
    name: string
  }
  from_value?: string
  to_value?: string
}

export function TicketDrawer({ ticket, open, onOpenChange }: TicketDrawerProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [updatedTicket, setUpdatedTicket] = useState({
    status: ticket?.status || '',
    priority: ticket?.priority || '',
    assigned_user_id: ticket?.assigned_user?.id || null
  })
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false)
  const [newSerialNumber, setNewSerialNumber] = useState({
    id: '',
    tag: '',
    description: '',
    hardware_type: '',
    location: ''
  })
  const [isAddingSerialNumber, setIsAddingSerialNumber] = useState(false)
  const [isSubmittingSerialNumber, setIsSubmittingSerialNumber] = useState(false)

  const trpc = useTRPC()
  const queryClient = makeQueryClient()
  
  console.log("ticket", ticket)
  // Fetch ticket updates/comments
  // const queryOptions = trpc.tickets..queryOptions
  // const { data: ticketWithUpdates, refetch } = useQuery({ ...queryOptions({ clientId: ticket?.id || '' }), enabled: !!ticket?.id })

  const { data: ticketWithComments } = useQuery({ ...trpc.comments.getByTicketId.queryOptions({ ticket_id: ticket?.id || '' }), enabled: !!ticket?.id })
  const { data: serialNumbers } = useQuery({ ...trpc.serviceTags.getByTicketId.queryOptions({ ticketId: ticket?.id || '' }), enabled: !!ticket?.id })

  // Fetch users for dropdown
  const { data: users } = useQuery(trpc.users.getAll.queryOptions())

  // Add comment mutation
  const { mutateAsync: addComment } = useMutation(trpc.comments.add.mutationOptions({
    onSuccess: () => {
      toast.success("Comentario agregado exitosamente")
      setNewComment("")
    },
    onError: (error) => {
      toast.error(`Error al agregar comentario: ${error.message}`)
    }
  }))
  
  // Update ticket mutation
  const { mutateAsync: updateTicket } = useMutation(trpc.tickets.update.mutationOptions({
    onSuccess: () => {
      toast.success("Ticket actualizado exitosamente")
      setIsEditing(false)
    },
    onError: (error) => {
      toast.error(`Error al actualizar ticket: ${error.message}`)
    }
  }))
  
  // Handle comment submission
  const handleAddComment = async (e: React.FormEvent, photoUrls: string[] = []) => {
    e.preventDefault()
    if (!ticket?.id || (!newComment.trim() && photoUrls.length === 0)) return
    
    try {
      setIsSubmittingComment(true)
      
      // In a real implementation, you would first upload the photos to your storage service
      // and then use the returned URLs. For now, we're just using the provided URLs directly.
      // Example of uploading to Supabase Storage:
      // const uploadedUrls = await Promise.all(photoFiles.map(async (file) => {
      //   const fileExt = file.name.split('.').pop()
      //   const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      //   const { data, error } = await supabase.storage
      //     .from('ticket-attachments')
      //     .upload(`${ticket.id}/${fileName}`, file)
      //   if (error) throw error
      //   return supabase.storage.from('ticket-attachments').getPublicUrl(data.path).data.publicUrl
      // }))
      
      await addComment({
        ticket_id: ticket.id,
        content: newComment.trim(),
        photo_urls: photoUrls
      })
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
        // status: updatedTicket.status,
        // priority: updatedTicket.priority,
        assigned_to: updatedTicket.assigned_user_id
      })
    } finally {
      setIsUpdatingTicket(false)
    }
  }
  
  // Mutation for adding a service tag to a ticket
  const { mutateAsync: addServiceTag } = useMutation(trpc.tickets.addServiceTag.mutationOptions({
    onSuccess: () => {
      toast.success('Número de serie añadido exitosamente')
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({
        queryKey: ["tickets", "all"],
      })
      if (ticket?.id) {
        queryClient.invalidateQueries({
          queryKey: ["tickets", "byId", ticket.id],
        })
        queryClient.invalidateQueries({
          queryKey: ["serviceTags", "byTicketId", ticket.id],
        })
      }
    },
    onError: (error) => {
      toast.error(`Error al añadir número de serie: ${error.message}`)
    }
  }))
  
  // Handle adding serial number
  const handleAddSerialNumber = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticket) return
    
    try {
      setIsSubmittingSerialNumber(true)
      
      // If we have a selected service tag ID, use that
      if (newSerialNumber.id) {
        await addServiceTag({
          ticketId: ticket.id,
          serviceTagId: newSerialNumber.id
        })
      } else {
        // Otherwise, create a new service tag first and then associate it
        // This would be handled by the SerialNumberForm component
        console.log('Creating new service tag not implemented in this handler')
      }
      
      // Reset form and close
      setNewSerialNumber({
        id: '',
        tag: '',
        description: '',
        hardware_type: '',
        location: ''
      })
      setIsAddingSerialNumber(false)
    } finally {
      setIsSubmittingSerialNumber(false)
    }
  }
  
  // Reset form when ticket changes
  useEffect(() => {
    if (ticket) {
      setUpdatedTicket({
        status: ticket.status || '',
        priority: ticket.priority || '',
        assigned_user_id: ticket.assigned_user?.id || null
      })
      setNewComment("")
      setNewSerialNumber({ id: '', tag: '', description: '', hardware_type: '', location: '' })
      setIsEditing(false)
    }
  }, [ticket])
  
  if (!ticket) return null

  // Extract ticket history from the detailed ticket data
  // const ticketHistory = ticketWithUpdates || []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
        {/* Header */}
        <TicketHeader 
          ticket={ticket}
        />
        
        {/* Fixed Details Section */}
        <div className="sticky top-0 z-10 bg-background px-6 pt-4">
          <TicketDetails 
            ticket={ticket}
            users={users}
          />
        </div>
        
        <Tabs defaultValue="serials" className="w-full" onValueChange={setActiveTab}>
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3 mb-4 text-xs">
              <TabsTrigger value="serials">Números de Serie</TabsTrigger>
              <TabsTrigger value="comments">Comentarios</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="serials" className="space-y-4 px-6 mt-0">
            {/* Serial Numbers */}
            <SerialNumbers 
              serialNumbers={serialNumbers || []}
              isLoadingSerialNumbers={false}
              handleAddSerialNumber={handleAddSerialNumber}
              newSerialNumber={newSerialNumber}
              setNewSerialNumber={setNewSerialNumber}
              isAddingSerialNumber={isAddingSerialNumber}
              setIsAddingSerialNumber={setIsAddingSerialNumber}
              isSubmittingSerialNumber={isSubmittingSerialNumber}
              clientId={ticket.client_id}
              ticketId={ticket.id}
            />
          </TabsContent>
          
          <TabsContent value="comments" className="space-y-4 px-6 mt-0">
            {/* Comments */}
            <TicketComments 
              ticket={ticket}
              ticketWithComments={ticketWithComments}
              newComment={newComment}
              setNewComment={setNewComment}
              isSubmittingComment={isSubmittingComment}
              handleAddComment={handleAddComment}
            />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 px-6 mt-0">
            {/* <TicketHistory 
              ticket={ticket}
              ticketHistory={ticketHistory}
            /> */}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
