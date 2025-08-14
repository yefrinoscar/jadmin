"use client"

import { useState, useRef } from "react"
import { format } from "date-fns"
import { MessageSquare, Loader2, User, Image as ImageIcon, X, Paperclip, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TicketListItem } from "@/trpc/api/routers/tickets"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Comment } from "@/trpc/api/routers/comments"


export interface TicketCommentsProps {
  ticket: TicketListItem
  ticketWithComments: Comment[] | undefined
  newComment: string
  setNewComment: (comment: string) => void
  isSubmittingComment: boolean
  handleAddComment: (e: React.FormEvent, files?: File[]) => Promise<void>
}

export function TicketComments({
  ticket,
  ticketWithComments,
  newComment,
  setNewComment,
  isSubmittingComment,
  handleAddComment
}: TicketCommentsProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...newFiles])
      
      // Create preview URLs for the selected images
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file))
      setPreviewUrls(prev => [...prev, ...newPreviewUrls])
    }
  }

  const removeFile = (index: number) => {
    // Release the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index])
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Pass the actual files to handleAddComment for processing
    await handleAddComment(e, selectedFiles)
    
    // Clear the selected files and previews after submission
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    setSelectedFiles([])
    setPreviewUrls([])
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'technician': return 'bg-blue-100 text-blue-800'
      case 'client': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-medium">Comentarios</h2>
      </div>
      
      {/* Comments list */}
      <ScrollArea className="flex-1 p-4">
        {ticketWithComments && ticketWithComments.length > 0 ? (
          <div className="space-y-6">
            {ticketWithComments.map((comment, index) => {
              const isFirstComment = index === 0
              const isPreviousSameUser = index > 0 && ticketWithComments[index - 1].user_name === comment.user_name
              const showHeader = isFirstComment || !isPreviousSameUser
              
              return (
                <div key={comment.id} className="group">
                  {showHeader && (
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(comment.user_name || 'Usuario')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.user_name || 'Usuario'}</span>
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full',
                          getRoleColor(comment.user_role)
                        )}>
                          {comment.user_role === 'admin' ? 'Admin' : 
                           comment.user_role === 'technician' ? 'Técnico' : 'Cliente'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className={cn(
                    "pl-10 relative",
                    !showHeader && "mt-1"
                  )}>
                    <div className="bg-muted/30 rounded-lg p-3 relative group-hover:bg-muted/50 transition-colors">
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      
                      {/* Display attachments if any */}
                      {comment.photo_urls && comment.photo_urls.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {comment.photo_urls.map((url, i) => {
                            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
                            const fileName = url.split('/').pop() || `File ${i+1}`;
                            
                            return isImage ? (
                              // Display images inline
                              <a 
                                key={i} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block relative aspect-square rounded-md overflow-hidden border bg-muted/20 hover:opacity-90 transition-opacity"
                              >
                                <img 
                                  src={url} 
                                  alt={`Attachment ${i+1}`} 
                                  className="object-cover w-full h-full"
                                />
                              </a>
                            ) : (
                              // Display other file types as download links
                              <a 
                                key={i} 
                                href={url} 
                                download={fileName}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center p-3 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors"
                              >
                                <Paperclip className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-xs truncate">{fileName}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "dd/MM/yyyy • HH:mm")}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
            <p>No hay comentarios para este ticket.</p>
          </div>
        )}
      </ScrollArea>
      
      <Separator />
      
      {/* Add comment form */}
      <div className="p-4 bg-muted/10">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea 
            id="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escriba su comentario aquí..."
            disabled={isSubmittingComment}
            className="min-h-[100px] resize-none"
          />
          
          {/* Image previews */}
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {previewUrls.map((url, index) => (
                <div 
                  key={index} 
                  className="relative w-16 h-16 rounded-md overflow-hidden border group"
                >
                  <img 
                    src={url} 
                    alt={`Preview ${index}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-0 right-0 bg-black/50 p-1 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
                id="file-upload"
              />
              {/* <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmittingComment}
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Adjuntar
              </Button> */}
              <span className="text-xs text-muted-foreground">
                {selectedFiles.length > 0 && `${selectedFiles.length} archivo(s) seleccionado(s)`}
              </span>
            </div>
            
            <Button 
              type="submit" 
              disabled={(!newComment.trim() && previewUrls.length === 0) || isSubmittingComment}
              size="sm"
            >
              {isSubmittingComment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
