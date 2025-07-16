"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TicketIcon, 
  Users, 
  Building2, 
  Tag,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from "lucide-react";

export function DashboardStats() {
  const trpc = useTRPC();
  const { data: tickets } = useQuery(trpc.tickets.getAll.queryOptions());
  const { data: clients } = useQuery(trpc.clients.getAll.queryOptions());
  const { data: serviceTags } = useQuery(trpc.serviceTags.getAll.queryOptions());
  const { data: users } = useQuery(trpc.users.getAll.queryOptions());

  // Calculate statistics
  const totalTickets = tickets?.length || 0;
  const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
  const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0;
  const criticalTickets = tickets?.filter(t => t.priority === 'critical').length || 0;

  const totalClients = clients?.length || 0;
  const totalServiceTags = serviceTags?.length || 0;
  const totalUsers = users?.length || 0;

  const stats = [
    {
      title: "Total de Tickets",
      value: totalTickets,
      icon: TicketIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12%",
      changeType: "increase"
    },
    {
      title: "Tickets Abiertos",
      value: openTickets,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "+5%",
      changeType: "increase"
    },
    {
      title: "En Progreso",
      value: inProgressTickets,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: "-2%",
      changeType: "decrease"
    },
    {
      title: "Resueltos",
      value: resolvedTickets,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+18%",
      changeType: "increase"
    },
    {
      title: "Prioridad Crítica",
      value: criticalTickets,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      change: "-10%",
      changeType: "decrease"
    },
    {
      title: "Clientes Activos",
      value: totalClients,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "+3%",
      changeType: "increase"
    },
    {
      title: "Etiquetas de Servicio",
      value: totalServiceTags,
      icon: Tag,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      change: "+8%",
      changeType: "increase"
    },
    {
      title: "Miembros del Equipo",
      value: totalUsers,
      icon: Users,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      change: "0%",
      changeType: "neutral"
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <TrendingUp className={`w-3 h-3 ${
                  stat.changeType === 'increase' ? 'text-green-600' :
                  stat.changeType === 'decrease' ? 'text-red-600' :
                  'text-gray-400'
                }`} />
                <span className={
                  stat.changeType === 'increase' ? 'text-green-600' :
                  stat.changeType === 'decrease' ? 'text-red-600' :
                  'text-gray-400'
                }>
                  {stat.change}
                </span>
                <span>del mes pasado</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 