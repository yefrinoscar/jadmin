"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TicketIcon, 
  Users, 
  Building2, 
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react";
import { trpc } from "@/components/providers/trpc-provider";
import { DashboardStats } from "./components/dashboard-stats";
import { RecentActivity } from "./components/recent-activity";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: tickets } = trpc.tickets.getAll.useQuery();
  const { data: clients } = trpc.clients.getAll.useQuery();
  const { data: serviceTags } = trpc.serviceTags.getAll.useQuery();

  // Calculate statistics
  const totalTickets = tickets?.length || 0;
  const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
  const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0;
  const totalClients = clients?.length || 0;
  const totalServiceTags = serviceTags?.length || 0;

  const stats = [
    {
      title: "Total de Tickets",
      value: totalTickets,
      description: "Todos los tickets de soporte",
      icon: TicketIcon,
      color: "text-blue-600",
    },
    {
      title: "Tickets Abiertos",
      value: openTickets,
      description: "Esperando atención",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "En Progreso",
      value: inProgressTickets,
      description: "En proceso de trabajo",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Resueltos",
      value: resolvedTickets,
      description: "Resueltos exitosamente",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Total de Clientes",
      value: totalClients,
      description: "Clientes activos",
      icon: Building2,
      color: "text-purple-600",
    },
    {
      title: "Etiquetas de Servicio",
      value: totalServiceTags,
      description: "Productos de hardware",
      icon: Users,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de Control</h1>
        <p className="text-gray-600">¡Bienvenido de nuevo! Aquí tienes una vista general de tu sistema de soporte.</p>
      </div>

      {/* Statistics */}
      <DashboardStats />

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className=" rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <Button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <span className="font-medium text-gray-900">Crear Nuevo Ticket</span>
                <p className="text-sm text-gray-600">Reportar un nuevo problema de hardware</p>
              </Button>
              <Button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <span className="font-medium text-gray-900">Agregar Cliente</span>
                <p className="text-sm text-gray-600">Registrar un nuevo cliente</p>
              </Button>
              <Button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <span className="font-medium text-gray-900">Agregar Etiqueta de Servicio</span>
                <p className="text-sm text-gray-600">Registrar nuevo hardware</p>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 