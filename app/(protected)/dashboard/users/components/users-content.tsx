"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UsersTable } from "./users-table";
import { useCallback } from "react";

export function UsersContent() {
  const trpc = useTRPC();
  // With useSuspenseQuery, the data is returned directly
  const { data: users, refetch } = useSuspenseQuery(trpc.users.getAll.queryOptions());
  
  // Get current user information including role
  const { data: currentUser } = useSuspenseQuery(trpc.users.getCurrentUser.queryOptions());
  // Type assertion for currentUser
  type UserWithRole = { role: string };
  const typedCurrentUser = currentUser as UserWithRole;
  
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
        data={users} 
        currentUserRole={typedCurrentUser.role}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}
