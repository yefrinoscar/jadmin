"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  content: string;
  sender_type: "visitor" | "ai" | "agent";
  created_at: string;
}

export interface CollectedInfo {
  name?: string;
  email?: string;
  reason?: string;
  phone?: string;
}

export interface ConversationState {
  id: string | null;
  managedBy: "ai" | "human";
  collectedInfo: CollectedInfo;
  status: "active" | "closed" | "archived";
}

export interface UseChatWidgetOptions {
  apiUrl: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  onNewMessage?: (message: ChatMessage) => void;
  onHandoff?: (managedBy: "ai" | "human") => void;
  storageKey?: string;
}

export interface UseChatWidgetReturn {
  messages: ChatMessage[];
  conversationState: ConversationState;
  isLoading: boolean;
  isSending: boolean;
  isConnected: boolean;
  sendMessage: (content: string) => Promise<void>;
  requestHuman: () => Promise<void>;
  startNewConversation: () => void;
  error: string | null;
}

// ============================================================================
// Hook: useChatWidget
// ============================================================================

export function useChatWidget(options: UseChatWidgetOptions): UseChatWidgetReturn {
  const {
    apiUrl,
    supabaseUrl,
    supabaseAnonKey,
    onNewMessage,
    onHandoff,
    storageKey = "jadmin_chat_conversation_id",
  } = options;

  // State
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>({
    id: null,
    managedBy: "ai",
    collectedInfo: {},
    status: "active",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for channels
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const conversationChannelRef = useRef<RealtimeChannel | null>(null);

  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = async () => {
      try {
        let url = supabaseUrl;
        let key = supabaseAnonKey;

        // If not provided, fetch from API
        if (!url || !key) {
          const res = await fetch(`${apiUrl}/api/chat/public?config=supabase`);
          const config = await res.json();
          url = config.url;
          key = config.anonKey;
        }

        if (url && key) {
          const client = createClient(url, key);
          setSupabase(client);
        }
      } catch (err) {
        console.error("Error initializing Supabase:", err);
        setError("Error de conexión con el servidor");
      }
    };

    initSupabase();
  }, [apiUrl, supabaseUrl, supabaseAnonKey]);

  // Load conversation from storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setConversationState((prev) => ({ ...prev, id: stored }));
      }
    }
  }, [storageKey]);

  // Save conversation to storage
  useEffect(() => {
    if (typeof window !== "undefined" && conversationState.id) {
      localStorage.setItem(storageKey, conversationState.id);
    }
  }, [conversationState.id, storageKey]);

  // Load initial messages and subscribe to realtime
  useEffect(() => {
    if (!conversationState.id || !supabase) {
      setMessages([]);
      return;
    }

    setIsLoading(true);

    // Load initial messages
    const loadMessages = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("chat_messages")
          .select("id, content, sender_type, created_at")
          .eq("conversation_id", conversationState.id)
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;
        setMessages(data || []);
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Load conversation state
    const loadConversationState = async () => {
      try {
        const { data } = await supabase
          .from("chat_conversations")
          .select("managed_by, collected_info, status")
          .eq("id", conversationState.id)
          .single();

        if (data) {
          setConversationState((prev) => ({
            ...prev,
            managedBy: data.managed_by || "ai",
            collectedInfo: data.collected_info || {},
            status: data.status || "active",
          }));
        }
      } catch (err) {
        console.error("Error loading conversation state:", err);
      }
    };

    loadMessages();
    loadConversationState();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`widget-messages:${conversationState.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationState.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            onNewMessage?.(newMsg);
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    // Subscribe to conversation changes (handoff detection)
    const conversationChannel = supabase
      .channel(`widget-conversation:${conversationState.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_conversations",
          filter: `id=eq.${conversationState.id}`,
        },
        (payload) => {
          const updated = payload.new as {
            managed_by: "ai" | "human";
            collected_info: CollectedInfo;
            status: "active" | "closed" | "archived";
          };
          
          setConversationState((prev) => {
            if (prev.managedBy !== updated.managed_by) {
              onHandoff?.(updated.managed_by);
            }
            return {
              ...prev,
              managedBy: updated.managed_by,
              collectedInfo: updated.collected_info || {},
              status: updated.status,
            };
          });
        }
      )
      .subscribe();

    messagesChannelRef.current = messagesChannel;
    conversationChannelRef.current = conversationChannel;

    // Cleanup
    return () => {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      if (conversationChannelRef.current) {
        supabase.removeChannel(conversationChannelRef.current);
        conversationChannelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [conversationState.id, supabase, onNewMessage, onHandoff]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;

      setIsSending(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/chat/public`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationState.id,
            message: content.trim(),
            sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al enviar mensaje");
        }

        // Set conversation ID if new conversation
        if (data.conversationId && !conversationState.id) {
          setConversationState((prev) => ({
            ...prev,
            id: data.conversationId,
            managedBy: data.managedBy || "ai",
            collectedInfo: data.collectedInfo || {},
          }));
        }

        // Update collected info
        if (data.collectedInfo) {
          setConversationState((prev) => ({
            ...prev,
            collectedInfo: { ...prev.collectedInfo, ...data.collectedInfo },
          }));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("Error sending message:", err);
      } finally {
        setIsSending(false);
      }
    },
    [apiUrl, conversationState.id, isSending]
  );

  // Request human support
  const requestHuman = useCallback(async () => {
    if (!conversationState.id || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      // Send a special message requesting human support
      const response = await fetch(`${apiUrl}/api/chat/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationState.id,
          message: "Deseo hablar con un agente humano",
          sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al solicitar agente");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      console.error("Error requesting human:", err);
    } finally {
      setIsSending(false);
    }
  }, [apiUrl, conversationState.id, isSending]);

  // Start new conversation
  const startNewConversation = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    setConversationState({
      id: null,
      managedBy: "ai",
      collectedInfo: {},
      status: "active",
    });
    setMessages([]);
    setError(null);
  }, [storageKey]);

  return {
    messages,
    conversationState,
    isLoading,
    isSending,
    isConnected,
    sendMessage,
    requestHuman,
    startNewConversation,
    error,
  };
}

