"use client"

import * as React from "react"
import Image from "next/image"
import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TicketPhotosProps {
  photos: string[] | null
}

export function TicketPhotos({ photos }: TicketPhotosProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1)

  if (!photos || photos.length === 0) {
    return null
  }
  
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }
  
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Fotos</h3>
      
      {/* Photo grid */}
      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="relative aspect-square rounded-md overflow-hidden border cursor-pointer"
            onClick={() => setSelectedPhotoIndex(index)}
          >
            <Image
              src={photo}
              alt={`Foto ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Full image modal */}
      <Dialog 
        open={selectedPhotoIndex >= 0} 
        onOpenChange={(open) => !open && setSelectedPhotoIndex(-1)}
      >
        <DialogContent className="max-w-[70vw] max-h-[70vh] p-6 overflow-hidden bg-white border rounded-lg shadow-lg">
          <DialogTitle className="sr-only">
            {selectedPhotoIndex >= 0 ? `Foto ${selectedPhotoIndex + 1} de ${photos.length}` : "Foto"}
          </DialogTitle>
          
          <DialogClose className="absolute top-2 right-2 z-20">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Image display */}
            {selectedPhotoIndex >= 0 && (
              <div className="relative w-full" style={{ height: "calc(70vh - 4rem)" }}>
                <Image
                  src={photos[selectedPhotoIndex]}
                  alt={`Foto ${selectedPhotoIndex + 1} de ${photos.length}`}
                  fill
                  className="object-contain"
                  sizes="70vw"
                  priority
                />
              </div>
            )}
            
            {/* Carousel navigation */}
            {photos.length > 1 && (
              <div className="absolute inset-x-0 bottom-0 flex justify-center items-center gap-4 py-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-white shadow-md"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm font-medium">
                  {selectedPhotoIndex + 1} / {photos.length}
                </span>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-white shadow-md"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
