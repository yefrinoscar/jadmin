"use client";

import { useState, useEffect } from "react";
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
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  disabled?: boolean;
}

export function AssignUserPopover({
  ticketId,
  currentAssignedUser,
  onAssignmentChange,
  disabled = false,
}: AssignUserPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localCurrentUser, setLocalCurrentUser] = useState<UserType | null>(currentAssignedUser);

  // Update local current user when prop changes
  useEffect(() => {
    setLocalCurrentUser(currentAssignedUser);
  }, [currentAssignedUser]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: assignableUsers, isLoading } = useQuery(trpc.users.getAssignableUsers.queryOptions());

  const { mutateAsync: updateTicket } = useMutation(
    trpc.tickets.update.mutationOptions({
      onMutate: async (newData) => {
        // Optimistic update
        setIsUpdating(true);
        const queryKey = [['tickets', 'getAll'], { type: 'query' }]

        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: queryKey,
        });
        
        // Snapshot the previous value
        const previousTickets = queryClient.getQueryData(queryKey);
        
        // Find the user to be assigned
        const userId = newData.assigned_to;
        const assignedUser = userId 
          ? assignableUsers?.find(u => u.id === userId) || null
          : null;
        
        // Convert to full UserType for the callback (add missing fields)
        const fullUserType = assignedUser ? {
          ...assignedUser,
          auth_id: null, // Add the missing auth_id field
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : null;

        setLocalCurrentUser(fullUserType);
        
        // Optimistically update the cache
        queryClient.setQueryData(queryKey, (old: any) => {
          // Handle both array and paginated data structures
          if (!old) return old;
          
          // If it's an array
          if (Array.isArray(old)) {
            return old.map((ticket) => 
              ticket.id === newData.id 
                ? { 
                    ...ticket, 
                    assigned_user: fullUserType,
                    ...(newData.status && { status: newData.status }),
                    ...(newData.priority && { priority: newData.priority })
                  }
                : ticket
            );
          }
          
          // If it's paginated data
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                tickets: page.tickets.map((ticket: any) =>
                  ticket.id === newData.id
                    ? { 
                        ...ticket, 
                        assigned_user: fullUserType,
                        ...(newData.status && { status: newData.status }),
                        ...(newData.priority && { priority: newData.priority })
                      }
                    : ticket
                ),
              })),
            };
          }
          
          return old;
        });
        
        // Call the callback for parent component updates
        onAssignmentChange?.(fullUserType);
        
        return { previousTickets, queryKey };
      },
      onSuccess: () => {
        toast.success("Asignación de ticket actualizada exitosamente");
        setOpen(false);
        setIsUpdating(false);
      },
      onError: (error, newData, context) => {
        // Revert optimistic update on error
        if (context?.previousTickets) {
          queryClient.setQueryData(context.queryKey, context.previousTickets);
        }
        
        toast.error("Error al actualizar la asignación: " + error.message);
        setIsUpdating(false);
      },
      onSettled: () => {
        // Always refetch after error or success
        // queryClient.invalidateQueries({
        //   queryKey: ["tickets", "all"],
        // });
      }
    })
  );

  const handleAssignUser = async (userId: string | null) => {
    if (isUpdating) return;
    
    // The mutation will handle setting isUpdating and optimistic updates
    await updateTicket({
      id: ticketId,
      assigned_to: userId,
    }).catch((error) => {
      console.error("Error assigning user:", error);
    });
  };

  const getCurrentUserDisplay = () => {
    if (!localCurrentUser) {
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
            {localCurrentUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate group-hover:text-primary transition-colors duration-200">
            {localCurrentUser.name}
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
            <Popover open={!disabled && open} onOpenChange={disabled ? undefined : setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-0 justify-start hover:bg-muted/50 w-full group transition-all duration-200 cursor-pointer"
                  disabled={disabled || isUpdating}
                >
                  {getCurrentUserDisplay()}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 backdrop-blur-xl bg-background/60" 
                align="start"
              >
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
                          {!localCurrentUser && (
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
                            {localCurrentUser?.id === user.id && (
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