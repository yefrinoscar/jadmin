"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TicketIcon, 
  Users, 
  Building2, 
  AlertTriangle,
  Clock,
  CheckCircle,
  PlusCircle,
  BarChart3,
  ArrowRight,
  Bell,
  Settings,
  Tag
} from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const trpc = useTRPC();
  const { data: tickets, isLoading: ticketsLoading } = useQuery(trpc.tickets.getAll.queryOptions());
  const { data: clients, isLoading: clientsLoading } = useQuery(trpc.clients.getAll.queryOptions());
  const { data: serviceTags, isLoading: serviceTagsLoading } = useQuery(trpc.serviceTags.getAll.queryOptions());
  const { data: users, isLoading: usersLoading } = useQuery(trpc.users.getAll.queryOptions());

  // Calculate statistics
  const totalTickets = tickets?.length || 0;
  const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
  const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0;
  const criticalTickets = tickets?.filter(t => t.priority === 'critical').length || 0;
  const totalClients = clients?.length || 0;
  const totalServiceTags = serviceTags?.length || 0;
  const totalUsers = users?.length || 0;

  // Calculate percentages for progress bars
  const openPercentage = totalTickets ? Math.round((openTickets / totalTickets) * 100) : 0;
  const inProgressPercentage = totalTickets ? Math.round((inProgressTickets / totalTickets) * 100) : 0;
  const resolvedPercentage = totalTickets ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  // Create recent activities from available data
  const recentActivities = tickets
    ?.slice(0, 5)
    .map((ticket) => {
      // Extract service tags from the nested structure
      const serviceTags = ticket.ticket_service_tags?.map((tst: any) => tst.service_tag) || [];
      
      return {
        id: `ticket-${ticket.id}`,
        type: 'ticket',
        title: ticket.title,
        description: `Prioridad: ${ticket.priority} | Estado: ${ticket.status}`,
        user: ticket.created_by?.name || 'Sistema',
        timestamp: ticket.time_open || ticket.created_at,
        status: ticket.status,
        priority: ticket.priority,
        serviceTags: serviceTags
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];

  // Main KPI cards
  const kpiCards = [
    {
      title: "Tickets Totales",
      value: totalTickets,
      icon: TicketIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12%",
      changeType: "increase",
      link: "/tickets"
    },
    {
      title: "Clientes Activos",
      value: totalClients,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "+3%",
      changeType: "increase",
      link: "/clients"
    },
    {
      title: "Etiquetas de Servicio",
      value: totalServiceTags,
      icon: Tag,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      change: "+8%",
      changeType: "increase",
      link: "/service-tags"
    },
    {
      title: "Equipo",
      value: totalUsers,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      change: "0%",
      changeType: "neutral",
      link: "/users"
    }
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header with welcome message and user info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-600 mt-1">Bienvenido de nuevo. Aquí tienes una vista general del sistema.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaciones</span>
            <Badge variant="secondary" className="ml-1">3</Badge>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuración</span>
          </Button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <Link href={card.link} key={index}>
            <Card className="hover:shadow-md transition-all duration-200 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {ticketsLoading || clientsLoading || serviceTagsLoading || usersLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <span className={`
                    ${card.changeType === 'increase' ? 'text-green-600' :
                      card.changeType === 'decrease' ? 'text-red-600' :
                        'text-gray-400'}
                  `}>
                    {card.change}
                  </span>
                  <span>del mes pasado</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Ticket Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Estado de Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Abiertos</span>
                <span className="text-blue-600">{openTickets} de {totalTickets}</span>
              </div>
              <Progress value={openPercentage} className="h-2 bg-blue-100" indicatorClassName="bg-blue-600" />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">En Progreso</span>
                <span className="text-yellow-600">{inProgressTickets} de {totalTickets}</span>
              </div>
              <Progress value={inProgressPercentage} className="h-2 bg-yellow-100" indicatorClassName="bg-yellow-600" />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">Resueltos</span>
                <span className="text-green-600">{resolvedTickets} de {totalTickets}</span>
              </div>
              <Progress value={resolvedPercentage} className="h-2 bg-green-100" indicatorClassName="bg-green-600" />
            </div>
            {criticalTickets > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-600 w-5 h-5" />
                  <span className="font-medium text-red-700">{criticalTickets} tickets críticos requieren atención</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Recent Activity and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="activity" className="gap-2">
                <Clock className="h-4 w-4" />
                Actividad Reciente
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pendientes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-0">
              <RecentActivity />
            </TabsContent>
            <TabsContent value="pending" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Tickets Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tickets?.filter(t => t.status === 'open' && t.priority === 'critical')
                      .slice(0, 5)
                      .map((ticket) => (
                        <div key={ticket.id} className="flex items-start gap-3 p-3 border border-red-100 bg-red-50 rounded-lg">
                          <div className="p-2 rounded-full bg-red-100">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                            <p className="text-sm text-gray-600 line-clamp-1">{ticket.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                                Crítico
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(ticket.time_open), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="shrink-0" asChild>
                            <Link href={`/tickets/${ticket.id}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ))
                    }
                    {tickets?.filter(t => t.status === 'open' && t.priority === 'critical').length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <p className="text-gray-500">No hay tickets críticos pendientes</p>
                        <p className="text-sm text-gray-400">¡Buen trabajo!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Quick Actions Panel */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
} 