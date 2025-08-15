"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Define ServiceTag type for this component
type ServiceTag = {
  id: string
  tag: string
  description: string
}

// Define Ticket type based on the API response
interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  source: string
  created_at: string
  updated_at: string
  assigned_to?: {
    id: string
    name: string
  } | null
  ticket_service_tags?: {
    service_tag: ServiceTag
  }[]
}

export function ClientTicketsContent() {
  const trpc = useTRPC();
  const { userId } = useAuth();
  
  // Get the client ID from the user metadata
  const { data: userData } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      const result = await fetch(`/api/trpc/users.getById?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"id":userId}}))}`);
      const data = await result.json();
      return data[0].result.data;
    },
    enabled: !!userId
  });
  
  const clientId = userData?.client_id;

  // Fetch tickets for the client
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['clientTickets', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const result = await fetch(`/api/trpc/tickets.getByClientId?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"clientId":clientId}}))}`);
      const data = await result.json();
      return data[0].result.data || [];
    },
    enabled: !!clientId
  });

  // Get status badge variant based on status
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'default'
      case 'in_progress':
        return 'secondary'
      case 'resolved':
        return 'outline'
      case 'closed':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // Get priority badge variant based on priority
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'open':
        return 'Abierto'
      case 'in_progress':
        return 'En Progreso'
      case 'resolved':
        return 'Resuelto'
      case 'closed':
        return 'Cerrado'
      default:
        return status
    }
  }

  // Format priority for display
  const formatPriority = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta'
      case 'medium':
        return 'Media'
      case 'low':
        return 'Baja'
      default:
        return priority
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="opacity-70">
            <CardContent className="p-6 animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
              <div className="flex justify-between mt-4">
                <div className="h-6 bg-muted rounded w-1/4"></div>
                <div className="h-6 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No tienes tickets de soporte actualmente.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tickets.map((ticket: Ticket) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-sm leading-tight">{ticket.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">#{ticket.id}</p>
              </div>
              <Badge variant={getPriorityVariant(ticket.priority)} className="text-xs">
                {formatPriority(ticket.priority)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Estado:</span>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(ticket.status)} className="text-xs">
                    {formatStatus(ticket.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Asignado:</span>
                <p className="mt-1 font-medium">{ticket.assigned_to?.name || 'Sin asignar'}</p>
              </div>
              {ticket.ticket_service_tags && ticket.ticket_service_tags.length > 0 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Número de Series:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ticket.ticket_service_tags.slice(0, 3).map((tag: {service_tag: ServiceTag}) => (
                      <Badge key={tag.service_tag.id} variant="outline" className="text-xs">
                        {tag.service_tag.tag}
                      </Badge>
                    ))}
                    {ticket.ticket_service_tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{ticket.ticket_service_tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              Creado: {format(new Date(ticket.created_at), "dd/MM/yyyy")}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
