"use client";

import { useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { 
  X, 
  Edit, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Building2,
  Tag,
  MessageSquare,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
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

export function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newUpdate, setNewUpdate] = useState("");

  const { data: ticket, isLoading, error } = trpc.tickets.getById.useQuery({ id: ticketId });
  const { data: users } = trpc.users.getAll.useQuery();
  
  const updateTicketMutation = trpc.tickets.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  const addUpdateMutation = trpc.tickets.addUpdate.useMutation({
    onSuccess: () => {
      setNewUpdate("");
    },
  });

  const handleSave = (field: string, value: any) => {
    if (!ticket) return;
    
    updateTicketMutation.mutate({
      id: ticket.id,
      [field]: value,
    });
  };

  const handleAddUpdate = () => {
    if (!newUpdate.trim() || !ticket) return;
    
    addUpdateMutation.mutate({
      ticket_id: ticket.id,
      message: newUpdate,
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-96  border-l border-gray-200 shadow-xl">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="fixed inset-y-0 right-0 w-96  border-l border-gray-200 shadow-xl">
        <div className="p-6">
          <p className="text-red-600">Error loading ticket details.</p>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[ticket.status];

  return (
    <div className="fixed inset-y-0 right-0 w-96  border-l border-gray-200 shadow-xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0  border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Ticket Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-medium text-gray-900">{ticket.title}</h3>
          <Badge className={priorityColors[ticket.priority]}>
            {ticket.priority}
          </Badge>
          <Badge className={statusColors[ticket.status]}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {ticket.status.replace("_", " ")}
          </Badge>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit className="w-4 h-4 mr-2" />
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="text-sm text-gray-900 mt-1">{ticket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                {isEditing ? (
                  <Select value={ticket.status} onValueChange={(value) => handleSave("status", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{ticket.status.replace("_", " ")}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Priority</label>
                {isEditing ? (
                  <Select value={ticket.priority} onValueChange={(value) => handleSave("priority", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{ticket.priority}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Assigned To</label>
              {isEditing ? (
                <Select value={ticket.assigned_to || ""} onValueChange={(value) => handleSave("assigned_to", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {users?.filter(u => u.role === 'technician' || u.role === 'admin').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 mt-1">
                  {ticket.assigned_user?.name || "Unassigned"}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Reported By</label>
              <p className="text-sm text-gray-900">{ticket.reported_user?.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Related Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Client</p>
                <p className="text-sm text-gray-900">{ticket.service_tags?.clients?.company_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Service Tag</p>
                <p className="text-sm text-gray-900">{ticket.service_tags?.tag}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Opened</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(ticket.time_open), "MMM dd, yyyy 'at' HH:mm")}
                </p>
              </div>
            </div>

            {ticket.time_closed && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Closed</p>
                  <p className="text-sm text-gray-900">
                    {format(new Date(ticket.time_closed), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new update */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Add an update..."
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button 
                onClick={handleAddUpdate}
                disabled={!newUpdate.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            {/* Updates list */}
            <div className="space-y-3">
              {ticket.ticket_updates?.map((update: any) => (
                <div key={update.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {update.users?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(update.created_at), "MMM dd, HH:mm")}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">{update.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 