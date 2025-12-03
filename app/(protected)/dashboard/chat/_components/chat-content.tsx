"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Send,
  User,
  Building2,
  Globe,
  UserCheck,
  RefreshCw,
  MessageSquare,
  Circle,
  Inbox,
} from "lucide-react";

import { ChatConversationListItem, ChatMessage } from "@/lib/schemas/chat";
import { cn } from "@/lib/utils";
import { useChatMessagesRealtime, useChatConversationsRealtime } from "@/lib/hooks/use-chat-realtime";

export function ChatContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<ChatConversationListItem | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    ...trpc.chat.getConversations.queryOptions(),
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    ...trpc.chat.getMessages.queryOptions({ conversationId: selectedConversation?.id || "" }),
    enabled: !!selectedConversation?.id,
  });

  // Sincronizar selectedConversation con los datos actualizados de conversations
  useEffect(() => {
    if (selectedConversation?.id && conversations) {
      const updated = conversations.find(c => c.id === selectedConversation.id);
      if (updated) {
        // Solo actualizar si hay cambios reales para evitar loops
        const hasChanges = 
          updated.message_count !== selectedConversation.message_count ||
          updated.needs_human_attention !== selectedConversation.needs_human_attention ||
          updated.is_resolved !== selectedConversation.is_resolved ||
          updated.last_message_at !== selectedConversation.last_message_at;
        
        if (hasChanges) {
          setSelectedConversation(updated);
        }
      }
    }
  }, [conversations]);

  // Suscribirse a cambios en tiempo real
  useChatConversationsRealtime(); // Actualiza la lista de conversaciones
  useChatMessagesRealtime(selectedConversation?.id || null); // Actualiza los mensajes de la conversación seleccionada

  // Fetch users for assignment
  const { data: users } = useQuery(trpc.users.getAll.queryOptions());

  // Send message mutation with optimistic update
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    ...trpc.chat.sendMessage.mutationOptions({
      onMutate: async (variables) => {
        const messagesQueryKey = trpc.chat.getMessages.queryKey({ conversationId: variables.conversationId });
        const conversationsQueryKey = trpc.chat.getConversations.queryKey();

        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: messagesQueryKey });
        await queryClient.cancelQueries({ queryKey: conversationsQueryKey });

        // Snapshot previous values
        const previousMessages = queryClient.getQueryData<ChatMessage[]>(messagesQueryKey);
        const previousConversations = queryClient.getQueryData<ChatConversationListItem[]>(conversationsQueryKey);

        // Optimistically update messages
        const optimisticMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          conversation_id: variables.conversationId,
          content: variables.content,
          sender_type: "agent",
          ai_model: null,
          agent_id: null,
          created_at: new Date().toISOString(),
        };

        queryClient.setQueryData<ChatMessage[]>(
          messagesQueryKey,
          (old) => (old ? [...old, optimisticMessage] : [optimisticMessage])
        );

        // Scroll to bottom after optimistic update
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);

        // Optimistically update conversations list
        queryClient.setQueryData<ChatConversationListItem[]>(
          conversationsQueryKey,
          (old) => {
            if (!old) return old;
            return old.map((conv) => {
              if (conv.id === variables.conversationId) {
                return {
                  ...conv,
                  last_message: variables.content.substring(0, 100),
                  last_message_at: new Date().toISOString(),
                  message_count: conv.message_count + 1,
                  needs_human_attention: false,
                };
              }
              return conv;
            });
          }
        );

        // Update selected conversation state
        if (selectedConversation?.id === variables.conversationId) {
          setSelectedConversation((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              last_message: variables.content.substring(0, 100),
              last_message_at: new Date().toISOString(),
              message_count: prev.message_count + 1,
              needs_human_attention: false,
            };
          });
        }

        return { previousMessages, previousConversations, messagesQueryKey, conversationsQueryKey };
      },
      onError: (error, variables, context) => {
        // Rollback on error
        if (context?.previousMessages && context?.messagesQueryKey) {
          queryClient.setQueryData(context.messagesQueryKey, context.previousMessages);
        }
        if (context?.previousConversations && context?.conversationsQueryKey) {
          queryClient.setQueryData(context.conversationsQueryKey, context.previousConversations);
        }
        toast.error(`Error al enviar mensaje: ${error.message}`);
      },
      onSuccess: (data, variables, context) => {
        // Replace optimistic message with real one
        if (context?.messagesQueryKey) {
          queryClient.setQueryData<ChatMessage[]>(
            context.messagesQueryKey,
            (old) => {
              if (!old) return [data];
              // Remove temporary message and add real one
              return old.filter((msg) => !msg.id.startsWith("temp-")).concat(data);
            }
          );
        }
        // Invalidate to ensure everything is in sync
        queryClient.invalidateQueries({ queryKey: trpc.chat.getMessages.queryKey({ conversationId: variables.conversationId }) });
        queryClient.invalidateQueries({ queryKey: trpc.chat.getConversations.queryKey() });
      },
      onSettled: () => {
        // Input is already cleared in handleSendMessage
        // Scroll to bottom after message is added
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      },
    }),
  });

  // Update conversation mutation
  const { mutate: updateConversation } = useMutation({
    ...trpc.chat.updateConversation.mutationOptions({
      onSuccess: () => {
        toast.success("Conversación actualizada");
        queryClient.invalidateQueries({ queryKey: [["chat", "getConversations"]] });
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    }),
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle refresh - reloads both panels while keeping content visible
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Refetch conversations
      await queryClient.refetchQueries({ queryKey: [["chat", "getConversations"]] });
      // Refetch messages if a conversation is selected
      if (selectedConversation) {
        await queryClient.refetchQueries({ queryKey: [["chat", "getMessages"]] });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, selectedConversation]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation?.id || !newMessage.trim() || isSending) return;
    const messageContent = newMessage.trim();
    // Clear input immediately for better UX
    setNewMessage("");
    sendMessage({
      conversationId: selectedConversation.id,
      content: messageContent,
    });
  };

  // Handle mark as resolved
  const handleMarkResolved = () => {
    if (!selectedConversation?.id) return;
    updateConversation({
      id: selectedConversation.id,
      is_resolved: true,
      status: "closed",
    });
    // Update local state
    setSelectedConversation({ ...selectedConversation, is_resolved: true, status: "closed" });
  };

  // Handle assign
  const handleAssign = (userId: string) => {
    if (!selectedConversation?.id) return;
    updateConversation({
      id: selectedConversation.id,
      assigned_to: userId === "unassigned" ? null : userId,
    });
  };

  // Count conversations needing attention
  const needsAttentionCount = conversations?.filter((c) => c.needs_human_attention && !c.is_resolved).length || 0;

  // Skeleton for initial load
  if (isLoadingConversations) {
    return (
      <div className="flex h-[calc(100vh-200px)] rounded-lg border bg-background overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-28 bg-muted rounded animate-pulse" />
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="p-2 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-40 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-6 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Chat area skeleton */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-muted animate-pulse mb-4" />
          <div className="h-5 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] rounded-lg border bg-background overflow-hidden">
      {/* Sidebar - Conversation List */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Conversaciones</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
          {needsAttentionCount > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {needsAttentionCount} requiere{needsAttentionCount > 1 ? "n" : ""} atención
              </span>
            </div>
          )}
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isRefreshing ? (
              // Skeleton while refreshing conversations
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg mb-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-3 w-40 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-6 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg mb-1 transition-colors",
                    "hover:bg-accent",
                    selectedConversation?.id === conv.id && "bg-accent",
                    conv.needs_human_attention && !conv.is_resolved && "border-l-2 border-l-amber-500"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{conv.visitor_name}</span>
                        {conv.needs_human_attention && !conv.is_resolved && (
                          <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                        )}
                        {conv.is_resolved && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.visitor_email}</p>
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                          {conv.last_message}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: es })}
                      </span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {conv.message_count}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No hay conversaciones</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{selectedConversation.visitor_name}</h3>
                    {selectedConversation.needs_human_attention && !selectedConversation.is_resolved && (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Requiere atención
                      </Badge>
                    )}
                    {selectedConversation.is_resolved && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Resuelto
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedConversation.visitor_email}
                    </span>
                    {selectedConversation.visitor_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedConversation.visitor_phone}
                      </span>
                    )}
                    {selectedConversation.visitor_company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {selectedConversation.visitor_company}
                      </span>
                    )}
                    {selectedConversation.source_url && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{selectedConversation.source_url}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedConversation.assigned_to || "unassigned"}
                    onValueChange={handleAssign}
                  >
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                      <SelectValue placeholder="Asignar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedConversation.is_resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkResolved}
                      className="h-8 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {isLoadingMessages ? (
                  // Skeleton for messages loading
                  <div className="space-y-4">
                    {/* Visitor message skeleton */}
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-10 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-16 w-64 bg-muted rounded-lg animate-pulse" />
                      </div>
                    </div>
                    {/* AI message skeleton */}
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-10 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-24 w-72 bg-muted rounded-lg animate-pulse" />
                      </div>
                    </div>
                    {/* Another visitor message skeleton */}
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-10 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-12 w-56 bg-muted rounded-lg animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No hay mensajes</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            {!selectedConversation.is_resolved && (
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="min-h-[60px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-[60px] w-12 shrink-0"
                    disabled={isSending || !newMessage.trim()}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  Enter para enviar · Shift+Enter nueva línea
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Selecciona una conversación</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Elige una conversación de la lista para ver los mensajes y responder al visitante
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Message bubble component
function MessageBubble({ message }: { message: ChatMessage }) {
  const isVisitor = message.sender_type === "visitor";
  const isAI = message.sender_type === "ai";
  const isAgent = message.sender_type === "agent";

  return (
    <div className={cn("flex gap-3", isVisitor ? "flex-row" : "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            isVisitor && "bg-secondary",
            isAI && "bg-purple-100 dark:bg-purple-950",
            isAgent && "bg-emerald-100 dark:bg-emerald-950"
          )}
        >
          {isVisitor && <User className="h-4 w-4 text-secondary-foreground" />}
          {isAI && <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
          {isAgent && <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex flex-col max-w-[70%]", isVisitor ? "items-start" : "items-end")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">
            {isVisitor && "Visitante"}
            {isAI && "Asistente IA"}
            {isAgent && "Agente"}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.created_at), "HH:mm", { locale: es })}
          </span>
        </div>
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm",
            isVisitor && "bg-secondary text-secondary-foreground",
            isAI && "bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-100",
            isAgent && "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {isAI && message.ai_model && (
          <span className="text-xs text-muted-foreground mt-1">vía {message.ai_model}</span>
        )}
      </div>
    </div>
  );
}
