"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  ArrowRight,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState } from "react";

type ActivityType = {
  id: string;
  type: string;
  title: string;
  description: string;
  user: string;
  timestamp: string;
  status: string;
  priority: string;
  ticketId?: string;
  serviceTags?: Array<{
    id: string;
    tag: string;
    description?: string;
  }>;
};

export function RecentActivity() {
  const trpc = useTRPC();
  const { data: tickets, isLoading } = useQuery(trpc.tickets.getAll.queryOptions());
  const [filter, setFilter] = useState<string | null>(null);

  // Create recent activities from available data
  const recentActivities = tickets
    ?.slice(0, 15)
    .map((ticket: any) => {
      // Extract service tags from the nested structure
      const serviceTags = ticket.ticket_service_tags?.map((tst: any) => tst.service_tag) || [];
      
      return {
        id: `ticket-${ticket.id}`,
        type: 'ticket',
        title: ticket.title,
        description: ticket.description?.substring(0, 120) || `Prioridad: ${ticket.priority} | Estado: ${ticket.status}`,
        user: ticket.created_by?.name || 'Sistema',
        timestamp: ticket.time_open || ticket.created_at,
        status: ticket.status,
        priority: ticket.priority,
        ticketId: ticket.id,
        serviceTags: serviceTags
      };
    })
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];

  // Apply filters if selected
  const filteredActivities = filter 
    ? recentActivities.filter((activity: ActivityType) => activity.status === filter)
    : recentActivities;

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open':
        return { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Abierto' };
      case 'in_progress':
        return { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'En Progreso' };
      case 'resolved':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Resuelto' };
      default:
        return { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Desconocido' };
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { className: 'bg-red-100 text-red-700 border-red-200', label: 'Crítico' };
      case 'high':
        return { className: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Alta' };
      case 'medium':
        return { className: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Media' };
      case 'low':
        return { className: 'bg-green-100 text-green-700 border-green-200', label: 'Baja' };
      default:
        return { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Normal' };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Actividad Reciente
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Button 
              variant={filter === null ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setFilter(null)}
              className="h-8 px-2 text-xs"
            >
              Todos
            </Button>
            <Button 
              variant={filter === "open" ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setFilter("open")}
              className="h-8 px-2 text-xs"
            >
              Abiertos
            </Button>
            <Button 
              variant={filter === "in_progress" ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setFilter("in_progress")}
              className="h-8 px-2 text-xs"
            >
              En Progreso
            </Button>
            <Button 
              variant={filter === "resolved" ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setFilter("resolved")}
              className="h-8 px-2 text-xs"
            >
              Resueltos
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity: ActivityType) => {
              const statusInfo = getStatusInfo(activity.status);
              const priorityBadge = getPriorityBadge(activity.priority);
              const Icon = statusInfo.icon;
              
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                  <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
                    <Icon className={`w-4 h-4 ${statusInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0" asChild>
                        <Link href={`/tickets/${activity.ticketId}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {activity.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-xs ${priorityBadge.className}`}>
                        {priorityBadge.label}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${statusInfo.bgColor} ${statusInfo.color} border-${statusInfo.color.replace('text-', '')}-200`}>
                        {statusInfo.label}
                      </Badge>
                      
                      {/* Display service tags if available */}
                      {activity.serviceTags && activity.serviceTags.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                          {activity.serviceTags[0].tag}
                          {activity.serviceTags.length > 1 && ` +${activity.serviceTags.length - 1}`}
                        </Badge>
                      )}
                      
                      <div className="flex items-center gap-1 ml-auto">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px]">
                            {activity.user.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">{activity.user}</span>
                        <span className="text-xs text-gray-400 mx-1">•</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredActivities.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sin actividad {filter ? `con estado "${filter}"` : 'reciente'}</p>
                <p className="text-sm text-gray-400">La actividad aparecerá aquí conforme suceda</p>
              </div>
            )}

            {filteredActivities.length > 0 && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/tickets">
                    Ver todos los tickets
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 