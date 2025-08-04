import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { ServiceTag } from '@/types/service-tag'

interface DeleteServiceTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTag: ServiceTag | null
  onDelete: () => void
  isDeleting: boolean
}

export function DeleteServiceTagDialog({
  open,
  onOpenChange,
  selectedTag,
  onDelete,
  isDeleting
}: DeleteServiceTagDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar Número de Serie</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar este número de serie? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {selectedTag && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <Badge variant="outline" className="font-mono mb-2">
                {selectedTag.tag}
              </Badge>
              {selectedTag.description && (
                <p className="text-sm text-gray-500">{selectedTag.description}</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            variant="destructive" 
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
