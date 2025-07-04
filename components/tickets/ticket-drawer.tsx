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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Calendar,
  User,
  Tag,
  Mail,
  Phone,
  Globe,
  Users,
  Edit,
  MoreHorizontal,
  MessageSquare,
  Timer,
  CheckCircle2
} from "lucide-react"
import { cn, parseServiceTags, cleanUserName } from "@/lib/utils"
import { Ticket } from "@/lib/types/ticket"
import { format } from "date-fns"
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_SOURCE_LABELS } from "@/lib/schemas"

interface TicketDrawerProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TicketDrawer({ ticket, open, onOpenChange }: TicketDrawerProps) {
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
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto p-6">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-bold">{ticket.id}</SheetTitle>
              <SheetDescription className="text-base font-medium text-foreground mt-1 overflow-hidden" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const
              }}>
                {ticket.title}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Assign to me</DropdownMenuItem>
                  <DropdownMenuItem>Change priority</DropdownMenuItem>
                  <DropdownMenuItem>Change status</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Delete ticket</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Status, Priority, Source, Service Tag Badges */}
          <div className="flex gap-2 flex-wrap">
            <StatusTag 
              status={ticket.status as keyof typeof TICKET_STATUS_LABELS}
              size="sm"
            />
            <PriorityTag 
              priority={ticket.priority as keyof typeof TICKET_PRIORITY_LABELS}
              size="sm"
            />
            <Badge variant={sourceConf.variant} className="text-xs">
              <SourceIcon className="w-3 h-3 mr-1" />
              {sourceConf.label}
            </Badge>
            {/* Multiple Service Tags */}
            {(() => {
              const serviceTags = parseServiceTags(ticket.service_tag_id)
              
              return serviceTags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs font-mono truncate max-w-[80px]"
                  title={tag}
                >
                  <Tag className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{tag}</span>
                </Badge>
              ))
            })()}
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Issue Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed overflow-hidden" style={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical' as const
            }}>{ticket.description}</p>
            {ticket.description && ticket.description.length > 200 && (
              <Button variant="ghost" size="sm" className="text-xs">
                Show more
              </Button>
            )}
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Assignment & Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Reported By</div>
                  <div className="text-sm font-medium">{ticket.reported_by}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Assigned To</div>
                  <div className="flex items-center gap-2">
                    {ticket.assigned_to ? (
                      <>
                        <div className="text-sm font-medium">
                          {cleanUserName(ticket.assigned_to)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          via {ticket.source}
                        </Badge>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">Unassigned</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Service Tags</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(() => {
                      const serviceTags = parseServiceTags(ticket.service_tag_id)
                      
                      if (serviceTags.length === 0) {
                        return <div className="text-sm text-muted-foreground italic">No service tags</div>
                      }
                      
                      return serviceTags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200 truncate max-w-[120px]"
                          title={tag}
                        >
                          {tag}
                        </Badge>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Timeline</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Created</div>
                  <div className="text-sm font-medium">
                    {ticket.time_open ? format(new Date(ticket.time_open), "PPP 'at' p") : format(new Date(ticket.created_at), "PPP 'at' p")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Last Updated</div>
                  <div className="text-sm font-medium">
                    {format(new Date(ticket.updated_at), "PPP 'at' p")}
                  </div>
                </div>
              </div>

              {ticket.time_closed && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Closed</div>
                    <div className="text-sm font-medium">
                      {format(new Date(ticket.time_closed), "PPP 'at' p")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <Timer className="h-4 w-4 mr-2" />
                Start Working
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <User className="h-4 w-4 mr-2" />
                Reassign
              </Button>
            </div>
          </div>

          <Separator />

          {/* Activity */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Activity & Comments
            </h3>
            <div className="text-sm text-muted-foreground">
              No updates yet. Add a comment to start the conversation.
            </div>
            <Button size="sm" className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 