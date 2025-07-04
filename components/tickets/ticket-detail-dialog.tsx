"use client"

import * as React from "react"
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusTag, PriorityTag } from "@/components/ui/status-tags"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar,
  User,
  Tag,
  Mail,
  Phone,
  Globe,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Ticket } from "@/lib/types/ticket"
import { format } from "date-fns"
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_SOURCE_LABELS } from "@/lib/schemas"

interface TicketDetailDrawerProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TicketDetailDrawer({ ticket, open, onOpenChange }: TicketDetailDrawerProps) {
  if (!ticket) return null



  const sourceConfig = {
    email: { label: TICKET_SOURCE_LABELS.email, icon: Mail, variant: "secondary" as const },
    phone: { label: TICKET_SOURCE_LABELS.phone, icon: Phone, variant: "default" as const },
    web: { label: TICKET_SOURCE_LABELS.web, icon: Globe, variant: "outline" as const },
    in_person: { label: TICKET_SOURCE_LABELS.in_person, icon: Users, variant: "destructive" as const },
  }

  const sourceConf = sourceConfig[ticket.source as keyof typeof sourceConfig]
  const SourceIcon = sourceConf.icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="min-w-[400px] sm:min-w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-2">
            <SheetTitle className="text-lg font-semibold">
              {ticket.id}
            </SheetTitle>
            <Badge variant={sourceConf.variant} className="text-xs">
              <SourceIcon className="w-3 h-3 mr-1" />
              {sourceConf.label}
            </Badge>
          </div>
          <SheetDescription className="text-base font-medium text-foreground">
            {ticket.title}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status and Priority */}
          <div className="flex items-center gap-4">
            <StatusTag 
              status={ticket.status as keyof typeof TICKET_STATUS_LABELS}
              size="default"
              showTooltip={true}
            />
            <PriorityTag 
              priority={ticket.priority as keyof typeof TICKET_PRIORITY_LABELS}
              size="default"
              showTooltip={true}
            />
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
            <p className="text-sm">{ticket.description}</p>
          </div>

          <Separator />

          {/* Details */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Time Opened</span>
              </div>
              <p className="text-sm font-medium">
                {ticket.time_open ? format(new Date(ticket.time_open), "PPP") : format(new Date(ticket.created_at), "PPP")}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Last Updated</span>
              </div>
              <p className="text-sm font-medium">
                {format(new Date(ticket.updated_at), "PPP")}
              </p>
            </div>
          </div>

          {ticket.time_closed && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Time Closed</span>
              </div>
              <p className="text-sm font-medium">
                {format(new Date(ticket.time_closed), "PPP")}
              </p>
            </div>
          )}

          {/* People */}
          <Separator />
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Reported By</span>
              </div>
              <p className="text-sm font-medium">{ticket.reported_by}</p>
            </div>
            {ticket.assigned_to && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Assigned To</span>
                </div>
                <p className="text-sm font-medium">{ticket.assigned_to}</p>
              </div>
            )}
          </div>

          {/* Service Tag */}
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>Service Tag</span>
            </div>
            <p className="text-sm font-medium">{ticket.service_tag_id}</p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm">
              Edit Ticket
            </Button>
            <Button variant="outline" size="sm">
              Add Comment
            </Button>
            <Button size="sm">
              Update Status
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 