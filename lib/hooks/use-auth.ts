import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { trpc } from "@/components/providers/trpc-provider";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const utils = trpc.useUtils();
  
  const signOut = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all query cache
      await utils.invalidate();
      
      // Clear any local storage items we might have set
      localStorage.clear();
      
      // Show success message
      toast.success("Sesión cerrada correctamente");
      
      // Force a router refresh and redirect
      router.refresh();
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión. Por favor intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    signOut,
    isLoading,
  };
} 