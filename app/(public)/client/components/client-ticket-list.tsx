"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  Tag,
  User,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  MapPin,
  Monitor,
  AlertCircle,
  Eye,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ClientTicketListProps {
  clientId: string;
}

const priorityConfig = {
  low: { 
    color: "bg-emerald-50 text-emerald-700 border-emerald-200", 
    icon: Minus, 
    label: "Baja",
    dotColor: "bg-emerald-400"
  },
  medium: { 
    color: "bg-amber-50 text-amber-700 border-amber-200", 
    icon: ArrowUp, 
    label: "Media",
    dotColor: "bg-amber-400"
  },
  high: { 
    color: "bg-red-50 text-red-700 border-red-200", 
    icon: TrendingUp, 
    label: "Alta",
    dotColor: "bg-red-400"
  },
};

const statusConfig = {
  open: { 
    color: "bg-blue-50 text-blue-700 border-blue-200", 
    icon: Clock, 
    label: "Abierto",
    dotColor: "bg-blue-400"
  },
  in_progress: { 
    color: "bg-orange-50 text-orange-700 border-orange-200", 
    icon: AlertTriangle, 
    label: "En Progreso",
    dotColor: "bg-orange-400"
  },
  resolved: { 
    color: "bg-green-50 text-green-700 border-green-200", 
    icon: CheckCircle, 
    label: "Resuelto",
    dotColor: "bg-green-400"
  },
  closed: { 
    color: "bg-gray-50 text-gray-700 border-gray-200", 
    icon: XCircle, 
    label: "Cerrado",
    dotColor: "bg-gray-400"
  },
};

export function ClientTicketList({ clientId }: ClientTicketListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const trpc = useTRPC();
  const { data: allTickets, isLoading, error } = useQuery(trpc.tickets.getAll.queryOptions());

  // Filter tickets for this specific client
  const clientTickets = allTickets?.filter((ticket: any) => 
    ticket.service_tags?.client_id === clientId
  );

  const filteredTickets = clientTickets?.filter((ticket: any) => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.service_tags?.tag.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error al cargar tickets: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // Get ticket statistics for overview
  const ticketStats = {
    total: filteredTickets?.length || 0,
    open: filteredTickets?.filter(t => t.status === 'open').length || 0,
    inProgress: filteredTickets?.filter(t => t.status === 'in_progress').length || 0,
    resolved: filteredTickets?.filter(t => t.status === 'resolved').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total</p>
                <p className="text-2xl font-bold text-blue-900">{ticketStats.total}</p>
              </div>
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Abiertos</p>
                <p className="text-2xl font-bold text-orange-900">{ticketStats.open}</p>
              </div>
              <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">En Progreso</p>
                <p className="text-2xl font-bold text-amber-900">{ticketStats.inProgress}</p>
              </div>
              <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Resueltos</p>
                <p className="text-2xl font-bold text-green-900">{ticketStats.resolved}</p>
              </div>
              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por título, descripción o etiqueta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-12 border-gray-200">
                  <Filter className="w-4 h-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="open">🔵 Abierto</SelectItem>
                  <SelectItem value="in_progress">🟡 En Progreso</SelectItem>
                  <SelectItem value="resolved">🟢 Resuelto</SelectItem>
                  <SelectItem value="closed">⚫ Cerrado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48 h-12 border-gray-200">
                  <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Filtrar por prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Prioridades</SelectItem>
                  <SelectItem value="low">🟢 Baja</SelectItem>
                  <SelectItem value="medium">🟡 Media</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Ticket Cards */}
      <div className="space-y-4">
        {filteredTickets?.map((ticket: any) => {
          const statusInfo = statusConfig[ticket.status as keyof typeof statusConfig];
          const priorityInfo = priorityConfig[ticket.priority as keyof typeof priorityConfig];
          const StatusIcon = statusInfo?.icon;
          const PriorityIcon = priorityInfo?.icon;
          
          const daysSinceOpen = ticket.time_open 
            ? Math.floor((new Date().getTime() - new Date(ticket.time_open).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          return (
            <Card key={ticket.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-400 bg-white">
              <CardContent className="p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                        {ticket.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusInfo?.dotColor}`}></div>
                        <div className={`w-2 h-2 rounded-full ${priorityInfo?.dotColor}`}></div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{ticket.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm text-gray-500 mb-1">
                      {daysSinceOpen === 0 ? "Creado hoy" : `Hace ${daysSinceOpen} día${daysSinceOpen > 1 ? 's' : ''}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      #{ticket.id.slice(-8)}
                    </div>
                  </div>
                </div>

                {/* Status and Priority Badges */}
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`${statusInfo?.color} border px-3 py-1 font-medium`}>
                    {StatusIcon && <StatusIcon className="w-3 h-3 mr-1.5" />}
                    {statusInfo?.label}
                  </Badge>
                  <Badge className={`${priorityInfo?.color} border px-3 py-1 font-medium`}>
                    {PriorityIcon && <PriorityIcon className="w-3 h-3 mr-1.5" />}
                    Prioridad {priorityInfo?.label}
                  </Badge>
                </div>

                {/* Key Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {ticket.service_tags?.tag && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Equipo</p>
                        <p className="font-medium text-gray-900">{ticket.service_tags.tag}</p>
                      </div>
                    </div>
                  )}
                  
                  {ticket.service_tags?.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Ubicación</p>
                        <p className="font-medium text-gray-900">{ticket.service_tags.location}</p>
                      </div>
                    </div>
                  )}
                  
                  {ticket.assigned_user && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Técnico Asignado</p>
                        <p className="font-medium text-gray-900">{ticket.assigned_user.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline Information */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Abierto: {format(new Date(ticket.time_open || ticket.created_at), "dd MMM yyyy", { locale: es })}</span>
                    </div>
                    {ticket.time_closed && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Cerrado: {format(new Date(ticket.time_closed), "dd MMM yyyy", { locale: es })}</span>
                      </div>
                    )}
                  </div>
                  
                  {ticket.ticket_updates && ticket.ticket_updates.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{ticket.ticket_updates.length} actualización{ticket.ticket_updates.length > 1 ? 'es' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Latest Update Preview */}
                {ticket.ticket_updates && ticket.ticket_updates.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-2 border-l-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        Última actualización por {ticket.ticket_updates[0].users?.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(ticket.ticket_updates[0].created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{ticket.ticket_updates[0].message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTickets?.length === 0 && (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                ? "No se encontraron tickets"
                : "No tienes tickets aún"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                ? "Intenta ajustar tus criterios de búsqueda para ver más resultados"
                : "Cuando tengas solicitudes de soporte, aparecerán aquí"}
            </p>
            {(searchTerm || statusFilter !== "all" || priorityFilter !== "all") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
                className="mt-2"
              >
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 