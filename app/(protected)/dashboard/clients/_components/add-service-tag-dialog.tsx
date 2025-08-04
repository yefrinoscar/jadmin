import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { ServiceTagForm, ServiceTagFormData } from './service-tag-form'

interface AddServiceTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ServiceTagFormData
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function AddServiceTagDialog({
  open,
  onOpenChange,
  formData,
  onInputChange,
  onSubmit,
  isSubmitting
}: AddServiceTagDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Número de Serie</DialogTitle>
          <DialogDescription>
            Ingresa la información del nuevo número de serie para este cliente.
          </DialogDescription>
        </DialogHeader>
        
        <ServiceTagForm formData={formData} onChange={onInputChange} />
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={onSubmit} 
            disabled={!formData.tag || isSubmitting}
          >
            {isSubmitting ? (
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
