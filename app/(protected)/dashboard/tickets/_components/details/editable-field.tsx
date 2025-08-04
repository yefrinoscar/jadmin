"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EditableFieldProps {
  label: string
  children: ReactNode
  className?: string
}

export function EditableField({
  label,
  children,
  className
}: EditableFieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-xs font-medium mb-0.5 text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  )
}
