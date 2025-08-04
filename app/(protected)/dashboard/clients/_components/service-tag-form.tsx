import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface ServiceTagFormData {
  tag: string
  description: string
  hardware_type: string
  location: string
}

interface ServiceTagFormProps {
  formData: ServiceTagFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function ServiceTagForm({ formData, onChange }: ServiceTagFormProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="tag">Número de Serie *</Label>
        <Input 
          id="tag" 
          name="tag" 
          value={formData.tag} 
          onChange={onChange} 
          placeholder="Ej: SN12345678" 
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea 
          id="description" 
          name="description" 
          value={formData.description} 
          onChange={onChange} 
          placeholder="Descripción del equipo o servicio" 
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="hardware_type">Tipo de Hardware</Label>
          <Input 
            id="hardware_type" 
            name="hardware_type" 
            value={formData.hardware_type} 
            onChange={onChange} 
            placeholder="Ej: Router, Switch" 
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input 
            id="location" 
            name="location" 
            value={formData.location} 
            onChange={onChange} 
            placeholder="Ej: Oficina principal" 
          />
        </div>
      </div>
    </div>
  )
}
