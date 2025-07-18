"use client"

import { formatDistanceToNow } from "date-fns"
import { 
  History, 
  Activity, 
  Calendar, 
  CheckCircle, 
  RefreshCcw, 
  MessageSquare, 
  UserCheck, 
  AlertTriangle, 
  Hash 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TicketListItem } from "@/trpc/api/routers/tickets"
import { TICKET_STATUS_LABELS } from "@/lib/schemas/ticket"

interface TicketHistoryItem {
  type: string
  description: string
  timestamp: string
  user?: {
    id: string
    name: string
  }
  from_value?: string
  to_value?: string
}

interface TicketHistoryProps {
  ticket: TicketListItem
  ticketHistory: TicketHistoryItem[]
}

export function TicketHistory({
  ticket,
  ticketHistory
}: TicketHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Actividad
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Timeline stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4 text-center hover:bg-muted/20 transition-colors">
            <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-lg font-bold">{ticketHistory.length}</p>
            <p className="text-xs text-muted-foreground">Eventos</p>
          </div>
          <div className="border rounded-lg p-4 text-center hover:bg-muted/20 transition-colors">
            <div className="bg-orange-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-lg font-bold">
              {ticket.status === 'closed' 
                ? Math.ceil((new Date(ticket.updated_at).getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60 * 24))
                : Math.ceil((new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60 * 24))
              }
            </p>
            <p className="text-xs text-muted-foreground">
              Días {ticket.status === 'closed' ? 'de duración' : 'abierto'}
            </p>
          </div>
          <div className="border rounded-lg p-4 text-center hover:bg-muted/20 transition-colors">
            <div className="bg-green-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-lg font-bold">{TICKET_STATUS_LABELS[ticket.status as keyof typeof TICKET_STATUS_LABELS]}</p>
            <p className="text-xs text-muted-foreground">Estado actual</p>
          </div>
        </div>
        
        {/* Timeline events */}
        {ticketHistory.length > 0 ? (
          <div className="space-y-4">
            {/* Commented out as it was in the original file */}
            {/* {ticketHistory.map((historyItem: TicketHistoryItem, index) => {
              // Determine icon and color based on history type
              let icon = <Activity className="h-4 w-4" />;
              let bgColor = "bg-blue-50";
              let textColor = "text-blue-600";
              
              if (historyItem.type === "status_change") {
                icon = <RefreshCcw className="h-4 w-4" />;
                bgColor = "bg-purple-50";
                textColor = "text-purple-600";
              } else if (historyItem.type === "comment_added") {
                icon = <MessageSquare className="h-4 w-4" />;
                bgColor = "bg-green-50";
                textColor = "text-green-600";
              } else if (historyItem.type === "assigned_change") {
                icon = <UserCheck className="h-4 w-4" />;
                bgColor = "bg-yellow-50";
                textColor = "text-yellow-600";
              } else if (historyItem.type === "priority_change") {
                icon = <AlertTriangle className="h-4 w-4" />;
                bgColor = "bg-red-50";
                textColor = "text-red-600";
              } else if (historyItem.type === "serial_added") {
                icon = <Hash className="h-4 w-4" />;
                bgColor = "bg-indigo-50";
                textColor = "text-indigo-600";
              }
              
              return (
                <div key={historyItem.type} className="flex gap-3">
                  <div className={`${bgColor} p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0`}>
                    <div className={textColor}>{icon}</div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{historyItem.description}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(historyItem.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {historyItem.user?.name || 'Sistema'}
                    </p>
                  </div>
                </div>
              );
            })} */}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay actividad registrada para este ticket.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
