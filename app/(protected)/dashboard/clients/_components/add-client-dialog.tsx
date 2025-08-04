"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useTRPC } from '@/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CreateClientInputSchema } from '@/lib/schemas'

export interface ClientFormData {
  email: string
  phone: string
  address: string
  company_name: string
}

interface AddClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientAdded: () => void
}

export function AddClientDialog({
  open,
  onOpenChange,
  onClientAdded
}: AddClientDialogProps) {
  const [formData, setFormData] = React.useState<ClientFormData>({
    email: '',
    phone: '',
    address: '',
    company_name: ''
  })

  const trpc = useTRPC()
  
  const createClientMutation = useMutation({
    mutationFn: (data: typeof CreateClientInputSchema._type) => {
      return fetch('/api/trpc/clients.create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: data
        }),
      }).then(res => res.json())
    },
    onSuccess: () => {
      toast.success('Cliente añadido correctamente')
      onOpenChange(false)
      resetForm()
      onClientAdded()
    },
    onError: (error: Error) => {
      console.error('Error adding client:', error)
      toast.error(`Error al añadir cliente: ${error.message || 'Error desconocido'}`)
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      email: '',
      phone: '',
      address: '',
      company_name: ''
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createClientMutation.mutate({
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      company_name: formData.company_name
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Cliente</DialogTitle>
          <DialogDescription>
            Ingresa la información del nuevo cliente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email"
              value={formData.email} 
              onChange={handleInputChange} 
              placeholder="correo@ejemplo.com" 
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
              title="Por favor ingrese un correo electrónico válido"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input 
              id="phone" 
              name="phone" 
              value={formData.phone} 
              onChange={handleInputChange} 
              placeholder="Número de teléfono" 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea 
              id="address" 
              name="address" 
              value={formData.address} 
              onChange={handleInputChange} 
              placeholder="Dirección completa" 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company_name">Nombre de Empresa *</Label>
            <Input 
              id="company_name" 
              name="company_name" 
              value={formData.company_name} 
              onChange={handleInputChange} 
              placeholder="Nombre de la empresa" 
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.company_name || createClientMutation.isPending}
          >
            {createClientMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
