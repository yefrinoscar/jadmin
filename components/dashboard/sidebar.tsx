"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  TicketIcon,
  Building2,
  Users,
  LogOut,
  Loader2,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useState } from "react";
import { useTRPC } from "@/trpc/client"
import { useQueryClient } from "@tanstack/react-query";
import { SignOutButton, useUser } from "@clerk/nextjs";
import type { LucideIcon } from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  adminOnly?: boolean;
  productionOnly?: boolean;
}

const navigation: NavigationItem[] = [
  { name: "Panel de Control", href: "/dashboard", icon: Home, disabled: true },
  { name: "Tickets", href: "/dashboard/tickets", icon: TicketIcon, disabled: true },
  { name: "Clientes", href: "/dashboard/clients", icon: Building2, disabled: true },
  { name: "Usuarios", href: "/dashboard/users", icon: Users, adminOnly: true },
  { name: "Chat Soporte", href: "/dashboard/chat", icon: MessageCircle },
];

const clientNavigation: NavigationItem[] = [
  { name: "Panel de Control", href: "/dashboard", icon: Home },
  { name: "Mis Tickets", href: "/clients/tickets", icon: TicketIcon },
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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient()
  const { user, isLoaded, isSignedIn } = useUser();

  const userMetadata = user?.publicMetadata;

  const userRole = userMetadata?.role;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  // Check if we're in production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isLoaded || !isSignedIn) {
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
          <Image
            src="/logo.svg"
            alt="JAdmin Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-lg font-semibold text-gray-900">JAdmin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {(userRole === 'client' ? clientNavigation : navigation).map((item) => {
          // Hide admin-only items from non-admin users
          if (item.adminOnly && !isAdmin) {
            return null;
          }

          // Hide production-only items in development
          if (item.productionOnly && !isProduction) {
            return null;
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isDisabled = item.disabled === true;

          const buttonContent = (
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "bg-blue-50 text-blue-700 border-blue-200",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={isDisabled}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Button>
          );

          if (isDisabled) {
            return (
              <div key={item.name} title="No disponible en este entorno">
                {buttonContent}
              </div>
            );
          }

          return (
            <Link key={item.name} href={item.href}>
              {buttonContent}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {user?.firstName?.[0].toUpperCase() || user?.emailAddresses?.[0].emailAddress?.[0].toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.emailAddresses?.[0].emailAddress}
            </p>
            <div className="mt-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${userRole && roleLabels[`${userRole}`] ? roleColors[`${userRole}`] : 'bg-blue-50 text-blue-700'}`}>
                {userRole ? roleLabels[`${userRole}`] : 'Usuario'}
              </span>
            </div>
          </div>
        </div>

        <SignOutButton redirectUrl="/login">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </SignOutButton>
      </div>
    </div>
  );
} 