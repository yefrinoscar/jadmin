"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { UsersTable } from "./users-table";
import { useCallback } from "react";
import { ClerkUser } from "@/lib/schemas";

export function UsersContent() {
  const trpc = useTRPC();
  
  // With useSuspenseQuery, the data is returned directly
  const { data: users, refetch } = useQuery(trpc.users.getAll.queryOptions());

  const { data: user } = useQuery(trpc.users.getCurrentUser.queryOptions());
  
  // Get current user information including role
  // Cast the user to our ClerkUserWithMetadata type to ensure publicMetadata is properly typed
  const clerkUser = user as ClerkUser;
  const typedCurrentUser = { role: clerkUser?.publicMetadata?.role as string || 'client' };

  const handleUserCreated = useCallback(() => {
    // Invalidate the users query
    refetch()
  }, [refetch]);

  const handleUserUpdated = useCallback(() => {
    // Invalidate the users query
    refetch()
  }, [refetch]);

  return (
    <div className="space-y-4 pt-6">
      
      <UsersTable 
        data={users || []} 
        currentUserRole={typedCurrentUser.role}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}
