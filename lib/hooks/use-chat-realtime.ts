import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook para suscribirse a cambios en tiempo real de mensajes de chat
 */
export function useChatMessagesRealtime(conversationId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    if (typeof window === 'undefined') return; // Solo en el cliente

    let channel: RealtimeChannel | null = null;

    try {
      const supabase = getSupabaseClient();
      
      // Suscribirse a nuevos mensajes en esta conversación
      channel = supabase
        .channel(`chat_messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          async () => {
            // Refetch inmediatamente para obtener los nuevos mensajes
            // Usar el patrón de queryKey de tRPC que incluye el router y procedure
            await queryClient.refetchQueries({ 
              predicate: (query) => {
                const key = query.queryKey[0];
                return Array.isArray(key) && key[0] === "chat" && key[1] === "getMessages";
              }
            });
            
            // También invalidar conversaciones para actualizar contadores y último mensaje
            await queryClient.refetchQueries({ 
              predicate: (query) => {
                const key = query.queryKey[0];
                return Array.isArray(key) && key[0] === "chat" && key[1] === "getConversations";
              }
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          async () => {
            await queryClient.refetchQueries({ 
              predicate: (query) => {
                const key = query.queryKey[0];
                return Array.isArray(key) && key[0] === "chat" && key[1] === "getMessages";
              }
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Subscribed to messages for conversation ${conversationId}`);
          }
          if (status === 'CHANNEL_ERROR') {
            console.error('❌ Error subscribing to chat messages');
          }
        });
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }

    return () => {
      if (channel) {
        try {
          const supabase = getSupabaseClient();
          supabase.removeChannel(channel);
          console.log(`🔌 Unsubscribed from messages for conversation ${conversationId}`);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      }
    };
  }, [conversationId, queryClient]);
}

/**
 * Hook para suscribirse a cambios en tiempo real de conversaciones
 */
export function useChatConversationsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === 'undefined') return; // Solo en el cliente

    let channel: RealtimeChannel | null = null;

    try {
      const supabase = getSupabaseClient();
      
      // Suscribirse a cambios en conversaciones
      channel = supabase
        .channel("chat_conversations")
        .on(
          "postgres_changes",
          {
            event: "*", // INSERT, UPDATE, DELETE
            schema: "public",
            table: "chat_conversations",
          },
          async () => {
            // Refetch inmediatamente para obtener las conversaciones actualizadas
            await queryClient.refetchQueries({ 
              predicate: (query) => {
                const key = query.queryKey[0];
                return Array.isArray(key) && key[0] === "chat" && key[1] === "getConversations";
              }
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscribed to chat conversations');
          }
          if (status === 'CHANNEL_ERROR') {
            console.error('❌ Error subscribing to chat conversations');
          }
        });
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }

    return () => {
      if (channel) {
        try {
          const supabase = getSupabaseClient();
          supabase.removeChannel(channel);
          console.log('🔌 Unsubscribed from chat conversations');
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      }
    };
  }, [queryClient]);
}

