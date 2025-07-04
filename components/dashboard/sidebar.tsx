"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  TicketIcon, 
  Building2, 
  Tag, 
  Users,
  Settings,
  LogOut 
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navigation = [
  { name: "Panel de Control", href: "/dashboard", icon: Home },
  { name: "Tickets", href: "/dashboard/tickets", icon: TicketIcon },
  { name: "Clientes", href: "/dashboard/clients", icon: Building2 },
  { name: "Etiquetas de Servicio", href: "/dashboard/service-tags", icon: Tag },
  { name: "Usuarios", href: "/dashboard/users", icon: Users, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // In a real app, you'd get the user role from your user data
  // For now, we'll assume admin role - you should implement proper role checking
  const isAdmin = true; // This should come from your user context/session

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">User</p>
            <p className="text-xs text-gray-500">
              {isAdmin ? "Administrator" : "Team Member"}
            </p>
          </div>
        </div>
        
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
} 