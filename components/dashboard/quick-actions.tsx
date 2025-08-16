"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Building2, 
  Tag, 
  TicketIcon, 
  Users,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

export function QuickActions() {
  const trpc = useTRPC();

  // Example mutation setup for creating a new ticket
  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/trpc/tickets.create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ json: data }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Handle success (e.g., show notification)
      console.log('Ticket created successfully');
    },
    onError: (error) => {
      // Handle error
      console.error('Error creating ticket:', error);
    }
  });

  const quickActions = [
    {
      title: "Crear Ticket",
      description: "Reportar un problema de hardware",
      icon: TicketIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/dashboard/tickets"
    },
    {
      title: "Agregar Cliente",
      description: "Registrar un nuevo cliente",
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      link: "/dashboard/clients"
    },
    {
      title: "Agregar Etiqueta",
      description: "Registrar nuevo hardware",
      icon: Tag,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      link: "/dashboard/clients"
    },
    {
      title: "Invitar Usuario",
      description: "Añadir miembro al equipo",
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      link: "/dashboard/users"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link href={action.link} key={index} className="block">
                <div className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer">
                  <div className={`p-2 rounded-full ${action.bgColor}`}>
                    <Icon className={`w-4 h-4 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
