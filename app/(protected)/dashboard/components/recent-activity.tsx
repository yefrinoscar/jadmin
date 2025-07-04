"use client";

import { trpc } from "@/components/providers/trpc-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity() {
  const { data: tickets } = trpc.tickets.getAll.useQuery();

  // Create recent activities from available data
  const recentActivities = tickets
    ?.slice(0, 10)
    .map((ticket: any) => ({
      id: `ticket-${ticket.id}`,
      type: 'ticket_created',
      title: `Nuevo ticket: "${ticket.title}"`,
      description: `Prioridad: ${ticket.priority} | Estado: ${ticket.status}`,
      user: ticket.reported_user?.name || 'Sistema',
      timestamp: ticket.time_open,
      icon: ticket.status === 'open' ? Clock : 
            ticket.status === 'in_progress' ? AlertTriangle :
            ticket.status === 'resolved' ? CheckCircle : XCircle,
      color: ticket.status === 'open' ? 'text-blue-600' : 
             ticket.status === 'in_progress' ? 'text-yellow-600' :
             ticket.status === 'resolved' ? 'text-green-600' : 'text-gray-600'
    }))
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity: any) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gray-100`}>
                  <Icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-4 h-4">
                      <AvatarFallback className="text-xs">
                        {activity.user.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-500">{activity.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {recentActivities.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Sin actividad reciente</p>
              <p className="text-sm text-gray-400">La actividad aparecerá aquí conforme suceda</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 