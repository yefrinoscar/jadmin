"use client"

import { useState } from "react"
import { Plus, Loader2, Trash2, Tag, Server, MapPin, Search, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SerialNumber } from "@/trpc/api/routers/service-tags"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ServiceTagErrorCode, SERVICE_TAG_ERROR_MESSAGES } from "@/lib/errors"

interface SerialNumberInput {
  tag: string
  description: string
  hardware_type: string
  location: string
}

interface CompanySerialNumber {
  id: string
  tag: string
  description: string
  hardware_type: string
  location: string
}

interface SerialNumbersProps {
  serialNumbers: SerialNumber[]
  handleAddSerialNumber: (e: React.FormEvent) => Promise<void>
  newSerialNumber: SerialNumberInput
  setNewSerialNumber: (serialNumber: SerialNumberInput) => void
  isAddingSerialNumber: boolean
  setIsAddingSerialNumber: (isAdding: boolean) => void
  isSubmittingSerialNumber: boolean
  clientId?: string
}

function SerialNumberTabs({
  newSerialNumber,
  setNewSerialNumber,
  handleAddSerialNumber,
  isSubmittingSerialNumber,
  setIsAddingSerialNumber,
  clientId,
  serialNumbers: existingSerialNumbers
}: {
  newSerialNumber: SerialNumberInput
  setNewSerialNumber: (serialNumber: SerialNumberInput) => void
  handleAddSerialNumber: (e: React.FormEvent) => Promise<void>
  isSubmittingSerialNumber: boolean
  setIsAddingSerialNumber: (isAdding: boolean) => void
  clientId?: string
  serialNumbers: SerialNumber[]
}) {
  const [selectedTab, setSelectedTab] = useState<string>("existing")
  const [searchQuery, setSearchQuery] = useState<string>("") 
  const [selectedSerialNumber, setSelectedSerialNumber] = useState<SerialNumber | null>(null)
  // We don't need this duplicate state since we already have newSerialNumber

  
  // Use tRPC to fetch real serial numbers by client
  const trpc = useTRPC()
  const { data: clientSerialNumbers = [] } = useQuery({
    ...trpc.serviceTags.getByClientId.queryOptions({ clientId: clientId || '' }),
    enabled: !!clientId
  })
  
  // Filter out serial numbers that are already in the ticket
  const filteredClientSerialNumbers = clientSerialNumbers.filter((sn: SerialNumber) => {
    // Check if this serial number is already in the ticket
    return !existingSerialNumbers.some(existingSn => existingSn.id === sn.id)
  })
  
  // Map the serial numbers to the format expected by the UI
  const companySerialNumbers: CompanySerialNumber[] = filteredClientSerialNumbers.map((sn: SerialNumber) => ({
    id: sn.id,
    tag: sn.tag,
    description: sn.description || '',
    hardware_type: sn.hardware_type || '',
    location: sn.location || ''
  }))
  
  const filteredSerialNumbers = searchQuery.trim() === "" 
    ? companySerialNumbers 
    : companySerialNumbers.filter(sn => 
        sn.tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
        sn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sn.hardware_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sn.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
  
  const handleSelectSerialNumber = (serialNumber: CompanySerialNumber) => {
    // Find the original SerialNumber object from clientSerialNumbers
    const originalSerialNumber = clientSerialNumbers.find((sn: SerialNumber) => sn.id === serialNumber.id) || null
    setSelectedSerialNumber(originalSerialNumber)
  }
  
  const handleSubmitExisting = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSerialNumber) return
    
    // Here you would handle adding the selected serial number to the ticket
    handleAddSerialNumber(e)
  }
  
  // Create new serial number mutation
  const { mutateAsync: createSerialNumber, isPending: isCreating } = useMutation(
    trpc.serviceTags.create.mutationOptions({
      onSuccess: () => {
        // Refetch serial numbers after creating a new one
        // Refetch the query manually to update the UI
        refetch()
      }
    })
  )
  
  // Extract refetch function from the query
  const { refetch } = useQuery({
    ...trpc.serviceTags.getByClientId.queryOptions({ clientId: clientId || '' }),
    enabled: false // Don't run this query automatically, we'll use refetch manually
  })
  
  // Handle creating a new serial number
  const handleCreateSerialNumber = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !newSerialNumber.tag || !newSerialNumber.description) return
    
    try {
      // Usamos isCreating de la mutación para mostrar el estado de carga
      await createSerialNumber({
        tag: newSerialNumber.tag,
        description: newSerialNumber.description,
        client_id: clientId,
        hardware_type: newSerialNumber.hardware_type || 'Unknown',
        location: newSerialNumber.location || 'Unknown'
      })
      
      // Mostrar mensaje de éxito
      toast.success("Número de serie creado exitosamente")
            
      // Reset form
      setNewSerialNumber({
        tag: '',
        description: '',
        hardware_type: '',
        location: ''
      })
      
      // Switch to existing tab
      setSelectedTab('existing')
    } catch (error: any) {
      // Extraer el mensaje de error específico
      let errorMessage = 'Error desconocido';
      
      if (error?.message) {
        errorMessage = error.message;
      }
      
      // Verificar si es un error de duplicado
      if (error?.cause === ServiceTagErrorCode.DUPLICATE_TAG) {
        errorMessage = SERVICE_TAG_ERROR_MESSAGES[ServiceTagErrorCode.DUPLICATE_TAG](newSerialNumber.tag);
      }
      
      // Mostrar mensaje de error
      toast.error(`Error al crear número de serie: ${errorMessage}`);
      console.error('Error creating serial number:', error);
    }
  }
  
  return (
    <Tabs defaultValue="existing" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-8">
        <TabsTrigger value="existing" className="text-xs">
          <Search className="h-3 w-3 mr-1.5" />
          Seleccionar Existente
        </TabsTrigger>
        <TabsTrigger value="new" className="text-xs">
          <PlusCircle className="h-3 w-3 mr-1.5" />
          Crear Nuevo
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="existing" className="mt-2 space-y-3">
        <div className="space-y-1.5">
          <Input
            type="search"
            placeholder="Buscar por ID, descripción, tipo..."
            className="h-8 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="h-48 border rounded-md p-1 overflow-y-auto">
          <div className="space-y-1">
            {filteredSerialNumbers.length > 0 ? (
              filteredSerialNumbers.map((serialNumber) => (
                <div 
                  key={serialNumber.id}
                  className={`flex items-start p-2 rounded-md cursor-pointer transition-colors ${selectedSerialNumber?.id === serialNumber.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/30 border border-transparent'}`}
                  onClick={() => handleSelectSerialNumber(serialNumber)}
                >
                  <div className="flex gap-2 w-full">
                    <Tag className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="w-full">
                      <div className="flex justify-between items-start w-full">
                        <p className="text-xs font-medium">{serialNumber.tag}</p>
                        <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal">
                          {serialNumber.hardware_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{serialNumber.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{serialNumber.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <p className="text-xs">No se encontraron resultados</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-1">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => setIsAddingSerialNumber(false)}
            className="h-7 text-xs"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitExisting}
            size="sm"
            disabled={!selectedSerialNumber || isSubmittingSerialNumber}
            className="h-7 text-xs"
          >
            {isSubmittingSerialNumber ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Agregando...
              </>
            ) : (
              'Agregar Seleccionado'
            )}
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="new" className="mt-2 space-y-3">
        <form onSubmit={handleCreateSerialNumber} className="space-y-3 relative">
          {isCreating && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 rounded-md">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium">Creando número de serie...</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tag" className="text-xs">Número de Serie</Label>
              <Input 
                id="tag"
                value={newSerialNumber.tag}
                onChange={(e) => setNewSerialNumber({...newSerialNumber, tag: e.target.value})}
                placeholder="Ingrese el número de serie"
                disabled={isSubmittingSerialNumber}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">Descripción</Label>
              <Input 
                id="description"
                value={newSerialNumber.description}
                onChange={(e) => setNewSerialNumber({...newSerialNumber, description: e.target.value})}
                placeholder="Ingrese la descripción"
                disabled={isSubmittingSerialNumber}
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hardware_type" className="text-xs">Tipo de Hardware</Label>
                <Input 
                  id="hardware_type"
                  value={newSerialNumber.hardware_type}
                  onChange={(e) => setNewSerialNumber({...newSerialNumber, hardware_type: e.target.value})}
                  placeholder="Ej: Laptop, Desktop, Printer"
                  disabled={isSubmittingSerialNumber}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs">Ubicación</Label>
                <Input 
                  id="location"
                  value={newSerialNumber.location}
                  onChange={(e) => setNewSerialNumber({...newSerialNumber, location: e.target.value})}
                  placeholder="Ej: Oficina Principal"
                  disabled={isSubmittingSerialNumber}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => setIsAddingSerialNumber(false)}
              disabled={isSubmittingSerialNumber || isCreating}
              className="h-7 text-xs"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              size="sm"
              disabled={!newSerialNumber.tag || !newSerialNumber.description || isSubmittingSerialNumber || isCreating}
              className="h-7 text-xs"
            >
              {(isSubmittingSerialNumber || isCreating) ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Crear y Agregar'
              )}
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  )
}

export function SerialNumbers({
  serialNumbers,
  handleAddSerialNumber,
  newSerialNumber,
  setNewSerialNumber,
  isAddingSerialNumber,
  setIsAddingSerialNumber,
  isSubmittingSerialNumber,
  clientId
}: SerialNumbersProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Total: {serialNumbers.length}</h3>
        </div>
        
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                className="h-8 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                onClick={() => setIsAddingSerialNumber(!isAddingSerialNumber)}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">Nuevo número</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Agregar nuevo número de serie</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Separator className="my-2" />
        {isAddingSerialNumber && (
          <Card className="mb-4 animate-in fade-in-0 slide-in-from-top-5 duration-300 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Agregar Número de Serie</CardTitle>
              <CardDescription className="text-xs">Seleccione un número existente o cree uno nuevo</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <SerialNumberTabs 
                newSerialNumber={newSerialNumber}
                setNewSerialNumber={setNewSerialNumber}
                handleAddSerialNumber={handleAddSerialNumber}
                isSubmittingSerialNumber={isSubmittingSerialNumber}
                setIsAddingSerialNumber={setIsAddingSerialNumber}
                clientId={clientId}
                serialNumbers={serialNumbers}
              />
            </CardContent>
          </Card>
        )}
        
        {serialNumbers && serialNumbers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {serialNumbers.map((serialNumber) => (
              <div 
                key={serialNumber.id} 
                className="flex items-start justify-between p-2.5 border rounded-md hover:border-primary/30 hover:bg-muted/5 transition-colors group"
              >
                <div className="flex gap-2">
                  <Tag className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{serialNumber.tag}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{serialNumber.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1">
                        <Server className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal">
                          {serialNumber.hardware_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal">
                          {serialNumber.location}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed rounded-md">
            <Tag className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm">No hay números de serie registrados</p>
            <Button 
              variant="link" 
              size="sm" 
              className="mt-2 text-xs h-auto p-0"
              onClick={() => setIsAddingSerialNumber(true)}
            >
              Agregar número de serie
            </Button>
          </div>
        )}
    </div>
  )
}
