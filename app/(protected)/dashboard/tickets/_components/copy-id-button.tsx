"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

interface CopyIdButtonProps {
  id: string
  className?: string
}

export function CopyIdButton({ id, className }: CopyIdButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  
  // Reset copied state after animation completes
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("ID copiado al portapapeles", {
        duration: 2000,
        className: "text-xs"
      })
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error("No se pudo copiar el ID", {
        duration: 2000,
        className: "text-xs"
      })
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`
              h-5 w-5 p-0 
              ${!isHovering ? 'opacity-0' : 'opacity-100'} 
              group-hover:opacity-100 
              transition-all duration-200 ease-in-out
              hover:bg-primary/10 hover:scale-110
              ${copied ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : ''}
              ${className || ''}
            `}
            onClick={() => copyToClipboard(id)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {copied ? (
              <Check className="h-2.5 w-2.5 animate-in zoom-in-50 duration-300" />
            ) : (
              <Copy className="h-2.5 w-2.5" />
            )}
            <span className="sr-only">Copiar ID</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="text-xs py-1 px-2">
          {copied ? "¡Copiado!" : "Copiar ID"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
