"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, AlertCircle, CheckCircle2, Circle, Zap, Ticket, MessageSquare, Calendar, FileText } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/api/root";
import { TicketDrawer } from "./ticket-drawer";

// Define types based on tRPC router output
type RouterOutput = inferRouterOutputs<AppRouter>;
type UserData = RouterOutput["users"]["getById"];
type Ticket = RouterOutput["tickets"]["getByClientId"][number];

// Define ServiceTag type for this component
type ServiceTag = {
  id: string
  tag: string
  description: string
}

export function ClientTicketsContent() {
  const trpc = useTRPC();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Get the client ID from the user metadata using proper tRPC integration
  const { data: userData } = useQuery(
    trpc.users.getById.queryOptions()
  );
  
  const clientId = userData ? userData.client_id : '';

  // Fetch tickets for the client using proper tRPC integration
  const { data: tickets, isLoading } = useQuery({
    ...trpc.tickets.getByClientId.queryOptions({
      clientId: clientId || ""
    }),
    enabled: !!clientId
  });

  // Handle ticket click
  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  // Get status icon and colors
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return { 
          icon: FileText, 
          color: 'text-purple-600', 
          bg: 'bg-purple-50', 
          border: 'border-purple-200',
          tagBg: 'bg-purple-100',
          tagText: 'text-purple-800'
        }
      case 'open':
        return { 
          icon: Ticket, 
          color: 'text-blue-600', 
          bg: 'bg-blue-50', 
          border: 'border-blue-200',
          tagBg: 'bg-blue-100',
          tagText: 'text-blue-800'
        }
      case 'in_progress':
        return { 
          icon: Clock, 
          color: 'text-orange-600', 
          bg: 'bg-orange-50', 
          border: 'border-orange-200',
          tagBg: 'bg-orange-100',
          tagText: 'text-orange-800'
        }
      case 'resolved':
        return { 
          icon: CheckCircle2, 
          color: 'text-green-600', 
          bg: 'bg-green-50', 
          border: 'border-green-200',
          tagBg: 'bg-green-100',
          tagText: 'text-green-800'
        }
      case 'closed':
        return { 
          icon: CheckCircle2, 
          color: 'text-gray-600', 
          bg: 'bg-gray-50', 
          border: 'border-gray-200',
          tagBg: 'bg-gray-100',
          tagText: 'text-gray-800'
        }
      default:
        return { 
          icon: Ticket, 
          color: 'text-gray-600', 
          bg: 'bg-gray-50', 
          border: 'border-gray-200',
          tagBg: 'bg-gray-100',
          tagText: 'text-gray-800'
        }
    }
  }

  // Get priority configuration
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { 
          color: 'text-red-600', 
          bg: 'bg-red-50', 
          border: 'border-red-200', 
          accent: 'bg-red-500',
          tagBg: 'bg-red-100',
          tagText: 'text-red-800',
          icon: AlertCircle
        }
      case 'medium':
        return { 
          color: 'text-yellow-600', 
          bg: 'bg-yellow-50', 
          border: 'border-yellow-200', 
          accent: 'bg-yellow-500',
          tagBg: 'bg-yellow-100',
          tagText: 'text-yellow-800',
          icon: Circle
        }
      case 'low':
        return { 
          color: 'text-green-600', 
          bg: 'bg-green-50', 
          border: 'border-green-200', 
          accent: 'bg-green-500',
          tagBg: 'bg-green-100',
          tagText: 'text-green-800',
          icon: Circle
        }
      default:
        return { 
          color: 'text-gray-600', 
          bg: 'bg-gray-50', 
          border: 'border-gray-200', 
          accent: 'bg-gray-500',
          tagBg: 'bg-gray-100',
          tagText: 'text-gray-800',
          icon: Circle
        }
    }
  }

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Pendiente de Aprobación'
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
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-12 max-w-md mx-auto">
          <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Circle className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tickets</h3>
          <p className="text-gray-600">No tienes tickets de soporte actualmente. Cuando tengas alguna solicitud, aparecerá aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket: Ticket, index: number) => {
        const statusConfig = getStatusConfig(ticket.status);
        const priorityConfig = getPriorityConfig(ticket.priority);
        const StatusIcon = statusConfig.icon;
        const PriorityIcon = priorityConfig.icon;
        
        return (
          <div
            key={ticket.id}
            className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleTicketClick(ticket)}
          >
            {/* Priority accent bar */}
            <div className={`absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full ${priorityConfig.accent}`}></div>
            
            <div className="flex items-start gap-5">
              {/* Status Icon */}
              <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${statusConfig.bg} ${statusConfig.border} border flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                <StatusIcon className={`w-7 h-7 ${statusConfig.color}`} />
              </div>
              
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xl leading-tight mb-2 group-hover:text-blue-600 transition-colors duration-200">
                      {ticket.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg text-xs font-medium">
                        #{ticket.id.slice(0, 8)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Creado {format(new Date(ticket.created_at), "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                {ticket.description && (
                  <div className="mb-4">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>
                )}
                
                {/* Status and Priority Tags */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Status Tag */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.tagBg} ${statusConfig.tagText} border ${statusConfig.border}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{formatStatus(ticket.status)}</span>
                  </div>
                  
                  {/* Priority Tag */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${priorityConfig.tagBg} ${priorityConfig.tagText} border ${priorityConfig.border}`}>
                    <PriorityIcon className="w-4 h-4" />
                    <span>Prioridad {formatPriority(ticket.priority)}</span>
                  </div>
                </div>
                
                {/* Assignment Info */}
                {ticket.assigned_to?.name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <div className="bg-gray-100 p-1.5 rounded-full">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <span>Asignado a <span className="font-semibold text-gray-900">{ticket.assigned_to.name}</span></span>
                  </div>
                )}
                
                {/* Service Tags */}
                {ticket.ticket_service_tags && ticket.ticket_service_tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <MessageSquare className="w-3 h-3" />
                      <span>Números de Serie</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ticket.ticket_service_tags.slice(0, 5).map((tag: {service_tag: ServiceTag}) => (
                        <span
                          key={tag.service_tag.id}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                        >
                          {tag.service_tag.tag}
                        </span>
                      ))}
                      {ticket.ticket_service_tags.length > 5 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          +{ticket.ticket_service_tags.length - 5} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        );
      })}
      
      {/* Ticket Drawer */}
      <TicketDrawer 
        ticket={selectedTicket}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
