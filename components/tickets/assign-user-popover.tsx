"use client";

import { useState } from "react";
import { User, Check, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/components/providers/trpc-provider";
import { toast } from "sonner";
import { User as UserType } from "@/lib/schemas";

// Simplified user type for assignment
type AssignableUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'client';
};

interface AssignUserPopoverProps {
  ticketId: string;
  currentAssignedUser: UserType | null;
  onAssignmentChange?: (user: UserType | null) => void;
}

export function AssignUserPopover({
  ticketId,
  currentAssignedUser,
  onAssignmentChange,
}: AssignUserPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: assignableUsers, isLoading } = trpc.users.getAssignableUsers.useQuery();
  const utils = trpc.useUtils();

  const updateTicketMutation = trpc.tickets.update.useMutation({
    onSuccess: () => {
      toast.success("Asignación de ticket actualizada exitosamente");
      utils.tickets.getAll.invalidate();
      setOpen(false);
      setIsUpdating(false);
    },
    onError: (error) => {
      toast.error("Error al actualizar la asignación: " + error.message);
      setIsUpdating(false);
    },
  });

  const handleAssignUser = async (userId: string | null) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      await updateTicketMutation.mutateAsync({
        id: ticketId,
        assigned_to: userId,
      });
      
      // Find the user and call the callback for optimistic updates
      const assignedUser = userId 
        ? assignableUsers?.find(u => u.id === userId) || null
        : null;
      
      // Convert to full UserType for the callback (add missing fields)
      const fullUserType = assignedUser ? {
        ...assignedUser,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } : null;
      
      onAssignmentChange?.(fullUserType);
    } catch (error) {
      console.error("Error assigning user:", error);
    }
  };

  const getCurrentUserDisplay = () => {
    if (!currentAssignedUser) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center border-2 border-transparent group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-200 cursor-pointer">
            <UserX className="h-4 w-4 group-hover:text-primary/70 transition-colors duration-200" />
          </div>
          <span className="text-sm group-hover:text-foreground transition-colors duration-200">Sin asignar</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center border-2 border-transparent group-hover:border-primary/50 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-200 cursor-pointer">
          <span className="text-xs font-medium text-primary group-hover:text-primary/90 transition-colors duration-200">
            {currentAssignedUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate group-hover:text-primary transition-colors duration-200">
            {currentAssignedUser.name}
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-0 justify-start hover:bg-muted/50 w-full group transition-all duration-200 cursor-pointer"
                  disabled={isUpdating}
                >
                  {getCurrentUserDisplay()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <User className="h-4 w-4" />
                    <h4 className="font-medium text-sm">Asignar a</h4>
                  </div>

                  {isLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2 p-2">
                          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                          <div className="flex-1 space-y-1">
                            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                            <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {/* Unassign option */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-auto p-2 hover:bg-muted/80 group transition-all duration-200 cursor-pointer"
                        onClick={() => handleAssignUser(null)}
                        disabled={isUpdating}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-transparent group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-200">
                            <UserX className="h-4 w-4 text-muted-foreground group-hover:text-primary/70 transition-colors duration-200" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-medium group-hover:text-primary transition-colors duration-200">Sin asignar</div>
                            <div className="text-xs text-muted-foreground">Remover asignación</div>
                          </div>
                          {!currentAssignedUser && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </Button>

                      {/* Assignable users */}
                      {assignableUsers?.map((user) => (
                        <Button
                          key={user.id}
                          variant="ghost"
                          className="w-full justify-start h-auto p-2 hover:bg-primary/5 group transition-all duration-200 cursor-pointer"
                          onClick={() => handleAssignUser(user.id)}
                          disabled={isUpdating}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-transparent group-hover:border-primary/40 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-200">
                              <span className="text-xs font-medium text-primary group-hover:text-primary/90 transition-colors duration-200">
                                {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="text-sm font-medium truncate group-hover:text-primary transition-colors duration-200">{user.name}</div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </div>
                                <Badge 
                                  variant={user.role === 'admin' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {user.role}
                                </Badge>
                              </div>
                            </div>
                            {currentAssignedUser?.id === user.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Haz clic para asignar o cambiar usuario</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 