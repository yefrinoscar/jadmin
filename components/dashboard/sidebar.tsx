"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  TicketIcon, 
  Building2, 
  Users,
  LogOut,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { trpc } from "@/components/providers/trpc-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from '@supabase/supabase-js';
import { toast } from "sonner";
import { useState } from "react";
import { useTRPC } from "@/trpc/client"
import { useQuery, useQueryClient } from "@tanstack/react-query";

const navigation = [
  { name: "Panel de Control", href: "/dashboard", icon: Home },
  { name: "Tickets", href: "/dashboard/tickets", icon: TicketIcon },
  { name: "Clientes", href: "/dashboard/clients", icon: Building2 },
  { name: "Usuarios", href: "/dashboard/users", icon: Users, adminOnly: true },
];

const roleLabels: Record<string, string> = {
  superadmin: "Super Administrador",
  admin: "Administrador",
  technician: "Técnico",
  client: "Cliente",
};

const roleColors: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  technician: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  client: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient()

  const { data: user, isLoading: isSessionLoading } = useQuery(trpc.auth.getSession.queryOptions());

  const userMetadata = (user as User)?.user_metadata;
  const userRole = userMetadata?.role;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

      // Get browser client for auth operations
      const supabase = createBrowserSupabaseClient();

      // Invalidate all tRPC queries first
      await queryClient.invalidateQueries();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Force a router refresh and redirect
      router.refresh();
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.dismiss();
      toast.error("Error al cerrar sesión. Por favor intente de nuevo.");
      setIsSigningOut(false);
    }
  };

  if (isSessionLoading || isSigningOut) {
    return (
      <div className="flex h-screen w-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {isSigningOut ? "Cerrando sesión..." : "Cargando..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <TicketIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900">JAdmin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          // Hide admin-only items from non-admin users
          if (item.adminOnly && !isAdmin) {
            return null;
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-blue-50 text-blue-700 border-blue-200"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {userMetadata?.name?.[0].toUpperCase() || user?.email?.[0].toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userMetadata?.name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
            <div className="mt-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${userRole && roleColors[userRole] ? roleColors[userRole] : 'bg-blue-50 text-blue-700'}`}>
                {userRole ? roleLabels[userRole] : 'Usuario'}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="w-4 h-4" />
            {isSigningOut ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cerrando sesión...
              </span>
            ) : (
              "Sign Out"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 