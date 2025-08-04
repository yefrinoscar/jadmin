import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, Plus, Tags, Trash2 } from 'lucide-react'
import { ServiceTag } from '@/types/service-tag'

interface ServiceTagListProps {
  serviceTags: ServiceTag[]
  isLoading: boolean
  onAddClick: () => void
  onEditClick: (tag: ServiceTag) => void
  onDeleteClick: (tag: ServiceTag) => void
}

export function ServiceTagList({
  serviceTags,
  isLoading,
  onAddClick,
  onEditClick,
  onDeleteClick
}: ServiceTagListProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Tags className="h-5 w-5 text-gray-400 mr-2" />
          Números de Serie
        </h3>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex items-center gap-1"
          onClick={onAddClick}
        >
          <Plus className="h-4 w-4" />
          Añadir
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : serviceTags && serviceTags.length > 0 ? (
        <div className="space-y-2">
          {serviceTags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
              <div className="flex-1">
                <Badge variant="outline" className="font-mono">
                  {tag.tag}
                </Badge>
                {tag.description && (
                  <p className="text-sm text-gray-500 mt-1">{tag.description}</p>
                )}
                {(tag.hardware_type || tag.location) && (
                  <div className="flex gap-2 mt-1">
                    {tag.hardware_type && (
                      <span className="text-xs text-gray-500">Tipo: {tag.hardware_type}</span>
                    )}
                    {tag.location && (
                      <span className="text-xs text-gray-500">Ubicación: {tag.location}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onEditClick(tag)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-red-500"
                  onClick={() => onDeleteClick(tag)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-md">
          <Tags className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No hay números de serie registrados</p>
          <p className="text-xs text-gray-400 mt-1">Añade un número de serie para este cliente</p>
        </div>
      )}
    </div>
  )
}
