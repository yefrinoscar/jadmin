"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { ChatMessage, ChatConversationListItem } from "@/lib/schemas/chat";

// ============================================================================
// Tipos internos para las respuestas de Supabase
// ============================================================================

interface DBChatMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: "visitor" | "ai" | "agent";
  ai_model: string | null;
  agent_id: string | null;
  created_at: string;
}

interface DBChatConversation {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string | null;
  visitor_company: string | null;
  status: "active" | "closed" | "archived";
  needs_human_attention: boolean;
  is_resolved: boolean;
  managed_by: "ai" | "human";
  collected_info: Record<string, string> | null;
  message_count: number;
  last_message_at: string;
  created_at: string;
  source_url: string | null;
  assigned_to: string | null;
}

// ============================================================================
// useChatMessagesRealtime - Hook para mensajes de una conversación
// ============================================================================

interface UseChatMessagesRealtimeReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook limpio para mensajes de chat en tiempo real.
 * 
 * - Al montar: hace UN único SELECT para traer el historial
 * - Se suscribe a INSERT en tiempo real
 * - Actualiza el estado local directamente (sin refetch ni polling)
 */
export function useChatMessagesRealtime(
  conversationId: string | null
): UseChatMessagesRealtimeReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Función para cargar mensajes iniciales
  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (fetchError) throw new Error(fetchError.message);

      setMessages((data as unknown as DBChatMessage[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar mensajes"));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Suscripción a realtime
  useEffect(() => {
    if (!conversationId || typeof window === "undefined") return;

    // Cargar mensajes iniciales
    fetchMessages();

    try {
      const supabase = getSupabaseClient();

      // Crear canal para esta conversación
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on<DBChatMessage>(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: RealtimePostgresChangesPayload<DBChatMessage>) => {
            // Agregar el nuevo mensaje al estado local
            const newMessage = payload.new as DBChatMessage;
            setMessages((prev) => {
              // Evitar duplicados
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(`✅ [Messages] Suscrito a conversación ${conversationId}`);
          }
          if (status === "CHANNEL_ERROR") {
            console.error("❌ [Messages] Error en suscripción");
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.error("Error configurando realtime:", err);
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        try {
          const supabase = getSupabaseClient();
          supabase.removeChannel(channelRef.current);
          console.log(`🔌 [Messages] Desuscrito de conversación ${conversationId}`);
        } catch (err) {
          console.error("Error removiendo canal:", err);
        }
        channelRef.current = null;
      }
    };
  }, [conversationId, fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    refetch: fetchMessages,
  };
}

// ============================================================================
// useChatConversationsRealtime - Hook para lista de conversaciones
// ============================================================================

interface UseChatConversationsRealtimeReturn {
  conversations: ChatConversationListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook limpio para lista de conversaciones en tiempo real.
 * 
 * - Al montar: hace UN único SELECT para traer las conversaciones
 * - Se suscribe a INSERT/UPDATE en tiempo real
 * - Actualiza el estado local directamente
 */
export function useChatConversationsRealtime(): UseChatConversationsRealtimeReturn {
  const [conversations, setConversations] = useState<ChatConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Función para cargar conversaciones
  const fetchConversations = useCallback(async () => {
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from("chat_conversations")
        .select(`
          id,
          visitor_name,
          visitor_email,
          visitor_phone,
          visitor_company,
          status,
          needs_human_attention,
          is_resolved,
          managed_by,
          collected_info,
          message_count,
          last_message_at,
          created_at,
          source_url,
          assigned_to
        `)
        .order("last_message_at", { ascending: false });

      if (fetchError) throw new Error(fetchError.message);

      // Obtener último mensaje de cada conversación
      const conversationsWithLastMessage = await Promise.all(
        ((data as unknown as DBChatConversation[]) || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from("chat_messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          const lastMsgContent = lastMsg?.content as string | null;

          return {
            ...conv,
            assigned_user: null, // Se puede enriquecer si es necesario
            last_message: lastMsgContent?.substring(0, 100) || null,
          } as ChatConversationListItem;
        })
      );

      setConversations(conversationsWithLastMessage);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar conversaciones"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Suscripción a realtime
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Cargar conversaciones iniciales
    fetchConversations();

    try {
      const supabase = getSupabaseClient();

      // Crear canal para conversaciones
      const channel = supabase
        .channel("conversations:all")
        .on<DBChatConversation>(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_conversations",
          },
          async (payload: RealtimePostgresChangesPayload<DBChatConversation>) => {
            // Nueva conversación
            const newConv = payload.new as DBChatConversation;
            setConversations((prev) => {
              if (prev.some((c) => c.id === newConv.id)) return prev;
              const newItem: ChatConversationListItem = {
                ...newConv,
                assigned_user: null,
                last_message: null,
              };
              return [newItem, ...prev];
            });
          }
        )
        .on<DBChatConversation>(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_conversations",
          },
          async (payload: RealtimePostgresChangesPayload<DBChatConversation>) => {
            // Conversación actualizada
            const updated = payload.new as DBChatConversation;
            
            // Obtener el último mensaje para esta conversación
            const { data: lastMsg } = await supabase
              .from("chat_messages")
              .select("content")
              .eq("conversation_id", updated.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            const lastMsgContent = lastMsg?.content as string | null;

            setConversations((prev) => {
              const index = prev.findIndex((c) => c.id === updated.id);
              if (index === -1) return prev;

              const updatedItem: ChatConversationListItem = {
                ...updated,
                assigned_user: prev[index].assigned_user,
                last_message: lastMsgContent?.substring(0, 100) || prev[index].last_message,
              };

              const newList = [...prev];
              newList[index] = updatedItem;

              // Reordenar por last_message_at
              return newList.sort(
                (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
            });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ [Conversations] Suscrito a cambios");
          }
          if (status === "CHANNEL_ERROR") {
            console.error("❌ [Conversations] Error en suscripción");
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.error("Error configurando realtime:", err);
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        try {
          const supabase = getSupabaseClient();
          supabase.removeChannel(channelRef.current);
          console.log("🔌 [Conversations] Desuscrito de cambios");
        } catch (err) {
          console.error("Error removiendo canal:", err);
        }
        channelRef.current = null;
      }
    };
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    refetch: fetchConversations,
  };
}

// ============================================================================
// useSingleConversationRealtime - Hook para una conversación específica
// ============================================================================

interface UseSingleConversationRealtimeReturn {
  conversation: ChatConversationListItem | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook para observar cambios en una conversación específica
 */
export function useSingleConversationRealtime(
  conversationId: string | null
): UseSingleConversationRealtimeReturn {
  const [conversation, setConversation] = useState<ChatConversationListItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId || typeof window === "undefined") {
      setConversation(null);
      return;
    }

    setIsLoading(true);

    const fetchConversation = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error: fetchError } = await supabase
          .from("chat_conversations")
          .select("*")
          .eq("id", conversationId)
          .single();

        if (fetchError) throw new Error(fetchError.message);

        setConversation({
          ...(data as unknown as DBChatConversation),
          assigned_user: null,
          last_message: null,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Error al cargar conversación"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();

    try {
      const supabase = getSupabaseClient();

      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on<DBChatConversation>(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_conversations",
            filter: `id=eq.${conversationId}`,
          },
          (payload: RealtimePostgresChangesPayload<DBChatConversation>) => {
            const updated = payload.new as DBChatConversation;
            setConversation((prev) => ({
              ...updated,
              assigned_user: prev?.assigned_user || null,
              last_message: prev?.last_message || null,
            }));
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch (err) {
      console.error("Error configurando realtime:", err);
    }

    return () => {
      if (channelRef.current) {
        try {
          const supabase = getSupabaseClient();
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.error("Error removiendo canal:", err);
        }
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  return {
    conversation,
    isLoading,
    error,
  };
}

