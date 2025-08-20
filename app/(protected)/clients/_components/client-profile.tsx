"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { User, Building2, Mail, Calendar, LogOut, Loader2 } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/api/root";

// Define types based on tRPC router output
type RouterOutput = inferRouterOutputs<AppRouter>;
type UserData = RouterOutput["users"]["getById"];

export function ClientProfile() {
  const trpc = useTRPC();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Get user data using tRPC
  const { data: userData, isLoading } = useQuery(
    trpc.users.getById.queryOptions()
  );

  console.log(userData);
  

  if (isLoading) {
    return (
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
        <CardContent className="p-8 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-muted"></div>
            <div className="space-y-3 flex-1">
              <div className="h-6 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded w-24"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userData) {
    return null;
  }

  const clientName = userData.clients?.name || "Cliente";
  const companyName = userData.clients?.company_name || "";
  
  return (
    <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
            </div>
          </div>
          
          {/* User Info Section - All aligned left */}
          <div className="flex-grow min-w-0">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-base font-semibold text-gray-900">{userData.name}</h1>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">
                  <Mail className="h-2.5 w-2.5 mr-1" />
                  {userData.email}
                </Badge>
              </div>
              {companyName && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="text-xs font-medium">{companyName}</span>
                </div>
              )}
            </div>
            
            {/* Additional Info */}
            {/* <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Cliente desde: {userData.created_at ? format(new Date(userData.created_at), "dd 'de' MMMM 'de' yyyy", { locale: require('date-fns/locale/es') }) : "N/A"}</span>
            </div> */}
          </div>
          
          {/* Sign Out Button */}
          <div className="ml-auto">
            <SignOutButton redirectUrl="/login">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                onClick={() => setIsSigningOut(true)}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-xs">Saliendo...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <LogOut className="h-3 w-3" />
                    <span className="text-xs">Salir</span>
                  </span>
                )}
              </Button>
            </SignOutButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
