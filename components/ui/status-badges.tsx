import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

interface PriorityBadgeProps {
  priority: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'open':
        return "default";
      case 'in_progress':
        return "secondary";
      case 'closed':
      case 'resolved':
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusClassName = (status: string): string => {
    switch (status) {
      case 'open':
        return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
      case 'in_progress':
        return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
      case 'closed':
        return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";
      case 'resolved':
        return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'open':
        return "Abierto";
      case 'in_progress':
        return "En Progreso";
      case 'closed':
        return "Cerrado";
      case 'resolved':
        return "Resuelto";
      default:
        return status;
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={getStatusClassName(status)}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getPriorityClassName = (priority: string): string => {
    switch (priority) {
      case 'critical':
      case 'high':
        return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
      case 'medium':
        return "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100";
      case 'low':
        return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";
    }
  };

  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case 'critical':
      case 'high':
        return "Alta";
      case 'medium':
        return "Media";
      case 'low':
        return "Baja";
      default:
        return "Normal";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={getPriorityClassName(priority)}
    >
      {getPriorityLabel(priority)}
    </Badge>
  );
}
