import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { ServiceTagForm, ServiceTagFormData } from './service-tag-form'

interface EditServiceTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ServiceTagFormData
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function EditServiceTagDialog({
  open,
  onOpenChange,
  formData,
  onInputChange,
  onSubmit,
  isSubmitting
}: EditServiceTagDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Número de Serie</DialogTitle>
          <DialogDescription>
            Modifica la información del número de serie seleccionado.
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
                Actualizando...
              </>
            ) : 'Actualizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
