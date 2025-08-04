"use client"

import * as React from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Building2, Mail, MapPin, Phone, Edit2, Ticket, Save, X } from "lucide-react"

import { useTRPC } from "@/trpc/client"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ServiceTag } from "@/types/service-tag"
import { AddServiceTagDialog } from "./add-service-tag-dialog"
import { EditServiceTagDialog } from "./edit-service-tag-dialog"
import { DeleteServiceTagDialog } from "./delete-service-tag-dialog"
import { ServiceTagForm, ServiceTagFormData } from "./service-tag-form"
import { ServiceTagList } from "./service-tag-list"

interface ClientWithStats {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
  service_tags_count: number
  active_tickets_count: number
}

interface ClientFormData {
  email: string | null
  phone: string | null
  address: string | null
}

interface ClientDetailsDrawerProps {
  client: ClientWithStats | null
  open: boolean
  onClose: () => void
}

export function ClientDetailsDrawer({ client, open, onClose }: ClientDetailsDrawerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [selectedTag, setSelectedTag] = React.useState<ServiceTag | null>(null)
  const [isEditingClient, setIsEditingClient] = React.useState(false)
  const [clientFormData, setClientFormData] = React.useState<ClientFormData>({
    email: null,
    phone: null,
    address: null
  })
  const [formData, setFormData] = React.useState<ServiceTagFormData>({
    tag: '',
    description: '',
    hardware_type: '',
    location: '',
  })

  const trpc = useTRPC()

  // Fetch service tags using tRPC
  const [serviceTags, setServiceTags] = React.useState<ServiceTag[]>([])
  
  // Initialize client form data when client changes
  React.useEffect(() => {
    if (client) {
      setClientFormData({
        email: client.email,
        phone: client.phone,
        address: client.address
      })
    }
  }, [client])
  
  // Client update mutation
  const { mutate: updateClient, isPending: isUpdatingClient } = useMutation({
    mutationFn: (data: { id: string } & Partial<ClientFormData>) => {
      return fetch('/api/trpc/clients.update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: data
        }),
      }).then(res => res.json())
    },
    onSuccess: () => {
      toast.success('Cliente actualizado correctamente')
      setIsEditingClient(false)
      // Force a refresh of the client data
      onClose()
    },
    onError: (error: Error) => {
      console.error('Error updating client:', error)
      toast.error(`Error al actualizar cliente: ${error.message || 'Error desconocido'}`)
    }
  })

  // Fetch service tags using React Query
  const queryOptions = trpc.serviceTags.getByClientId.queryOptions
  const { data, isLoading } = useQuery(
    {
      ...queryOptions({ clientId: client?.id || '' }),
      enabled: !!client?.id && open // Only run query if client ID exists and drawer is open
    }
  )
  
  // Update local state when data changes
  React.useEffect(() => {
    if (data) {
      // Asegurar que las fechas se manejan como strings
      const formattedData = data.map(tag => ({
        ...tag,
        created_at: typeof tag.created_at === 'object' ? tag.created_at.toISOString() : tag.created_at,
        updated_at: typeof tag.updated_at === 'object' ? tag.updated_at.toISOString() : tag.updated_at
      }))
      setServiceTags(formattedData)
    }
  }, [data])

  // Reset form data
  const resetForm = () => {
    setFormData({
      tag: '',
      description: '',
      hardware_type: '',
      location: '',
    })
  }

  // Create mutation for adding service tags
  const { mutate: addServiceTag, isPending: isAddingServiceTag } = useMutation({
    mutationFn: (data: {
      client_id: string;
      tag: string;
      description: string;
      hardware_type: string;
      location: string;
    }) => {
      return fetch('/api/trpc/serviceTags.create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: data
        }),
      }).then(res => res.json())
    },
    onSuccess: (response) => {
      const responseData = response.result.data
      // Asegurar que las fechas se manejan como strings
      const newTag = {
        ...responseData,
        created_at: typeof responseData.created_at === 'object' ? responseData.created_at.toISOString() : responseData.created_at,
        updated_at: typeof responseData.updated_at === 'object' ? responseData.updated_at.toISOString() : responseData.updated_at
      }
      setServiceTags(prev => [newTag, ...prev])
      toast.success('Número de serie añadido correctamente')
      setIsAddDialogOpen(false)
      resetForm()
    },
    onError: (error: Error) => {
      console.error('Error adding service tag:', error)
      toast.error(`Error al añadir número de serie: ${error.message || 'Error desconocido'}`)
    }
  })

  // Create mutation for updating service tags
  const { mutate: updateServiceTag, isPending: isUpdatingServiceTag } = useMutation({
    mutationFn: (data: {
      id: string;
      client_id: string;
      tag: string;
      description: string;
      hardware_type: string;
      location: string;
    }) => {
      return fetch('/api/trpc/serviceTags.update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: data
        }),
      }).then(res => res.json())
    },
    onSuccess: (response) => {
      const responseData = response.result.data
      // Asegurar que las fechas se manejan como strings
      const updatedTag = {
        ...responseData,
        created_at: typeof responseData.created_at === 'object' ? responseData.created_at.toISOString() : responseData.created_at,
        updated_at: typeof responseData.updated_at === 'object' ? responseData.updated_at.toISOString() : responseData.updated_at
      }
      setServiceTags(prev => prev.map(tag => 
        tag.id === updatedTag.id ? updatedTag : tag
      ))
      toast.success('Número de serie actualizado correctamente')
      setIsEditDialogOpen(false)
      setSelectedTag(null)
      resetForm()
    },
    onError: (error: Error) => {
      console.error('Error updating service tag:', error)
      toast.error(`Error al actualizar número de serie: ${error.message || 'Error desconocido'}`)
    }
  })

  // Create mutation for deleting service tags
  const { mutate: deleteServiceTag, isPending: isDeletingServiceTag } = useMutation({
    mutationFn: async (data: { id: string }) => {
      const response = await fetch('/api/trpc/serviceTags.delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: data
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al eliminar número de serie')
      }
      
      return response.json()
    },
    onSuccess: () => {
      if (selectedTag) {
        setServiceTags(prev => prev.filter(tag => tag.id !== selectedTag.id))
        toast.success('Número de serie eliminado correctamente')
        setIsDeleteDialogOpen(false)
        setSelectedTag(null)
      }
    },
    onError: (error: Error) => {
      console.error('Error deleting service tag:', error)
      toast.error(`Error al eliminar número de serie: ${error.message || 'Error desconocido'}`)
    }
  })

  // Handle adding a new service tag
  const handleAddServiceTag = () => {
    if (!client) return

    addServiceTag({
      client_id: client.id,
      tag: formData.tag,
      description: formData.description || '',
      hardware_type: formData.hardware_type || '',
      location: formData.location || ''
    })
  }

  // Handle updating a service tag
  const handleUpdateServiceTag = () => {
    if (!selectedTag) return
    
    updateServiceTag({
      id: selectedTag.id,
      client_id: selectedTag.client_id,
      tag: formData.tag,
      description: formData.description,
      hardware_type: formData.hardware_type,
      location: formData.location
    })
  }

  // Handle deleting a service tag
  const handleDeleteServiceTag = () => {
    if (!selectedTag) return
    
    deleteServiceTag({
      id: selectedTag.id
    })
  }

  // Handle opening edit dialog
  const handleEditClick = (tag: ServiceTag) => {
    setSelectedTag(tag)
    setFormData({
      tag: tag.tag,
      description: tag.description || '',
      hardware_type: tag.hardware_type || '',
      location: tag.location || ''
    })
    setIsEditDialogOpen(true)
  }

  // Handle opening delete dialog
  const handleDeleteClick = (tag: ServiceTag) => {
    setSelectedTag(tag)
    setIsDeleteDialogOpen(true)
  }

  // Handle form input changes for service tags
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle form input changes for client data
  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setClientFormData(prev => ({ ...prev, [name]: value || null }))
  }
  
  // Handle client update
  const handleUpdateClient = () => {
    if (!client) return

    updateClient({
      id: client.id,
      email: clientFormData.email,
      phone: clientFormData.phone,
      address: clientFormData.address
    })
  }
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditingClient) {
      // If we're cancelling edit mode, reset the form data
      if (client) {
        setClientFormData({
          email: client.email,
          phone: client.phone,
          address: client.address
        })
      }
      setIsEditingClient(false)
    } else {
      setIsEditingClient(true)
    }
  }

  // Don't render the drawer or execute any logic if there's no valid client
  if (!client || !client.id) {
    // Close the drawer if it's somehow open without a valid client
    if (open) {
      onClose()
    }
    return null
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="p-6 overflow-y-auto" side="right">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl font-bold">{client?.name}</SheetTitle>
            <SheetDescription>
              Detalles del cliente y números de serie asociados
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {/* Client Details */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                  Información del Cliente
                </h3>
                {!isEditingClient ? (
                  <button
                    onClick={toggleEditMode}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleUpdateClient}
                      disabled={isUpdatingClient}
                      className="flex items-center text-sm text-green-600 hover:text-green-800"
                    >
                      {isUpdatingClient ? (
                        <span className="animate-spin mr-1">⏳</span>
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Guardar
                    </button>
                    <button
                      onClick={toggleEditMode}
                      className="flex items-center text-sm text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
              <Separator className="my-3" />
              <div className="grid gap-4">
                <div className="flex items-start">
                  <Building2 className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="w-full">
                    <h4 className="font-medium">Nombre de Empresa</h4>
                    <p className="text-sm text-gray-500">
                      {client?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="w-full">
                    <h4 className="font-medium">Dirección</h4>
                    {isEditingClient ? (
                      <textarea
                        name="address"
                        value={clientFormData.address || ''}
                        onChange={handleClientInputChange}
                        className="mt-1 w-full text-sm p-2 border rounded-md"
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm text-gray-500">
                        {client?.address || 'No disponible'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="w-full">
                    <h4 className="font-medium">Email</h4>
                    {isEditingClient ? (
                      <input
                        type="email"
                        name="email"
                        value={clientFormData.email || ''}
                        onChange={handleClientInputChange}
                        className="mt-1 w-full text-sm p-2 border rounded-md"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">
                        {client?.email || 'No disponible'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div className="w-full">
                    <h4 className="font-medium">Teléfono</h4>
                    {isEditingClient ? (
                      <input
                        type="tel"
                        name="phone"
                        value={clientFormData.phone || ''}
                        onChange={handleClientInputChange}
                        className="mt-1 w-full text-sm p-2 border rounded-md"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">
                        {client?.phone || 'No disponible'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Fecha de Registro</h4>
                    <p className="text-sm text-gray-500">
                      {client?.created_at ? format(new Date(client.created_at), 'dd/MM/yyyy') : 'No disponible'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Ticket className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Tickets Activos</h4>
                    <p className="text-sm text-gray-500">
                      {client?.active_tickets_count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Tags */}
            <ServiceTagList
              serviceTags={serviceTags}
              isLoading={isLoading}
              onAddClick={() => setIsAddDialogOpen(true)}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Service Tag Dialog */}
      <AddServiceTagDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleAddServiceTag}
        isSubmitting={isAddingServiceTag}
      />

      {/* Edit Service Tag Dialog */}
      <EditServiceTagDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleUpdateServiceTag}
        isSubmitting={isUpdatingServiceTag}
      />

      {/* Delete Service Tag Dialog */}
      <DeleteServiceTagDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedTag={selectedTag}
        onDelete={handleDeleteServiceTag}
        isDeleting={isDeletingServiceTag}
      />
    </>
  )
}
