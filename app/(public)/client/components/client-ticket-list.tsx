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
  User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface ClientTicketListProps {
  clientId: string;
}

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const statusIcons: Record<string, any> = {
  open: Clock,
  in_progress: AlertTriangle,
  resolved: CheckCircle,
  closed: XCircle,
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar tus tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Prioridades</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets?.map((ticket: any) => {
          const StatusIcon = statusIcons[ticket.status];
          const daysSinceOpen = Math.floor(
            (new Date().getTime() - new Date(ticket.time_open).getTime()) / (1000 * 60 * 60 * 24)
          );

          return (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{ticket.title}</CardTitle>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={statusColors[ticket.status]}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {daysSinceOpen === 0 ? "Hoy" : `Hace ${daysSinceOpen} días`}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{ticket.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Etiqueta de Servicio:</span>
                    <span className="font-medium">{ticket.service_tags?.tag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Abierto:</span>
                    <span className="font-medium">
                      {format(new Date(ticket.time_open), "MMM dd, yyyy")}
                    </span>
                  </div>
                  {ticket.assigned_user && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Asignado a:</span>
                      <span className="font-medium">{ticket.assigned_user.name}</span>
                    </div>
                  )}
                  {ticket.time_closed && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Cerrado:</span>
                      <span className="font-medium">
                        {format(new Date(ticket.time_closed), "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Recent Updates */}
                {ticket.ticket_updates && ticket.ticket_updates.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Última Actualización:</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {ticket.ticket_updates[0].users?.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(ticket.ticket_updates[0].created_at), "MMM dd, HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{ticket.ticket_updates[0].message}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTickets?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No se encontraron tickets</p>
            <p className="text-sm text-gray-400">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                ? "Intenta ajustar tus criterios de búsqueda"
                : "Aún no tienes tickets"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 