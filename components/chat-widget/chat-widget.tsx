"use client";

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { useChatWidget, type UseChatWidgetOptions } from "./use-chat-widget";
import { ChatMessageItem, TypingIndicator } from "./chat-message";
import {
  MessageCircle,
  X,
  Send,
  RotateCcw,
  User,
  Bot,
  Wifi,
  WifiOff,
  Sparkles,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface ChatWidgetProps {
  /** API URL for the chat backend */
  apiUrl?: string;
  /** Supabase URL (optional, will be fetched from API if not provided) */
  supabaseUrl?: string;
  /** Supabase Anon Key (optional, will be fetched from API if not provided) */
  supabaseAnonKey?: string;
  /** Widget title */
  title?: string;
  /** Widget subtitle when AI is responding */
  subtitleAI?: string;
  /** Widget subtitle when human is responding */
  subtitleHuman?: string;
  /** Primary color for the widget */
  primaryColor?: string;
  /** Welcome message shown when no conversation */
  welcomeMessage?: string;
  /** Placeholder for the input */
  placeholder?: string;
  /** Position of the widget */
  position?: "bottom-right" | "bottom-left";
  /** Initial open state */
  defaultOpen?: boolean;
  /** Z-index for the widget */
  zIndex?: number;
  /** Custom class name */
  className?: string;
  /** Callback when widget opens */
  onOpen?: () => void;
  /** Callback when widget closes */
  onClose?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ChatWidget({
  apiUrl = typeof window !== "undefined" ? window.location.origin : "",
  supabaseUrl,
  supabaseAnonKey,
  title = "Soporte",
  subtitleAI = "Asistente Virtual",
  subtitleHuman = "Agente de Soporte",
  primaryColor,
  welcomeMessage = "¡Hola! 👋 ¿En qué puedo ayudarte hoy?",
  placeholder = "Escribe tu mensaje...",
  position = "bottom-right",
  defaultOpen = false,
  zIndex = 9999,
  className,
  onOpen,
  onClose,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hookOptions: UseChatWidgetOptions = {
    apiUrl,
    supabaseUrl,
    supabaseAnonKey,
  };

  const {
    messages,
    conversationState,
    isLoading,
    isSending,
    isConnected,
    sendMessage,
    requestHuman,
    startNewConversation,
    error,
  } = useChatWidget(hookOptions);

  const isHumanMode = conversationState.managedBy === "human";
  const isClosed = conversationState.status === "closed";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle open/close
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  // Handle send
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const message = inputValue.trim();
    setInputValue("");
    await sendMessage(message);
  };

  // Handle key press
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  // Position classes
  const positionClasses = {
    "bottom-right": "right-4 sm:right-6",
    "bottom-left": "left-4 sm:left-6",
  };

  // CSS variables for custom color
  const customStyles = primaryColor
    ? ({
        "--widget-primary": primaryColor,
        "--widget-primary-foreground": "#ffffff",
      } as React.CSSProperties)
    : undefined;

  // Floating button (closed state)
  if (!isOpen) {
    return (
      <button
        onClick={handleToggle}
        style={{ zIndex, ...customStyles }}
        className={cn(
          "fixed bottom-4 sm:bottom-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "flex items-center justify-center",
          "hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
          positionClasses[position],
          primaryColor && "[background:var(--widget-primary)]",
          className
        )}
        aria-label="Abrir chat"
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        {/* Pulse animation when there might be unread */}
        <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div
      style={{ zIndex, ...customStyles }}
      className={cn(
        "fixed bottom-4 sm:bottom-6",
        "w-[calc(100vw-2rem)] sm:w-[400px] h-[min(600px,calc(100vh-6rem))]",
        "bg-background rounded-2xl shadow-2xl",
        "flex flex-col overflow-hidden",
        "border border-border/50",
        "animate-in fade-in-0 slide-in-from-bottom-4 duration-300",
        positionClasses[position],
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "px-4 py-3 flex items-center justify-between",
          "bg-primary text-primary-foreground",
          primaryColor && "[background:var(--widget-primary)]"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-white/20"
              )}
            >
              {isHumanMode ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>
            {/* Connection indicator */}
            <span
              className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-primary",
                isConnected ? "bg-emerald-400" : "bg-amber-400",
                primaryColor && "border-[var(--widget-primary)]"
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs opacity-90 flex items-center gap-1">
              {isHumanMode ? (
                <>
                  <User className="w-3 h-3" />
                  {subtitleHuman}
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  {subtitleAI}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Connection status */}
          <div
            className={cn(
              "p-2 rounded-full transition-colors",
              "hover:bg-white/10"
            )}
            title={isConnected ? "Conectado" : "Reconectando..."}
          >
            {isConnected ? (
              <Wifi className="w-4 h-4 opacity-70" />
            ) : (
              <WifiOff className="w-4 h-4 opacity-70 animate-pulse" />
            )}
          </div>

          {/* New conversation */}
          {conversationState.id && (
            <button
              onClick={startNewConversation}
              className={cn(
                "p-2 rounded-full transition-colors",
                "hover:bg-white/10"
              )}
              title="Nueva conversación"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={handleToggle}
            className={cn(
              "p-2 rounded-full transition-colors",
              "hover:bg-white/10"
            )}
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Handoff indicator */}
      {isHumanMode && (
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs text-center flex items-center justify-center gap-2">
          <User className="w-3 h-3" />
          Un agente está atendiendo tu consulta
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs text-center">
          {error}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Welcome state */}
        {!conversationState.id && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                "bg-primary/10 text-primary",
                primaryColor && "bg-[var(--widget-primary)]/10 text-[var(--widget-primary)]"
              )}
            >
              <MessageCircle className="w-8 h-8" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">¡Bienvenido!</h4>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              {welcomeMessage}
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showHeader =
            !prevMessage ||
            prevMessage.sender_type !== message.sender_type ||
            new Date(message.created_at).getTime() -
              new Date(prevMessage.created_at).getTime() >
              60000;

          return (
            <ChatMessageItem
              key={message.id}
              message={message}
              isOwnMessage={message.sender_type === "visitor"}
              showHeader={showHeader}
            />
          );
        })}

        {/* Typing indicator */}
        {isSending && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!isClosed ? (
        <div className="border-t border-border/50 p-3">
          {/* Quick actions */}
          {!isHumanMode && messages.length > 2 && (
            <div className="mb-2">
              <button
                onClick={requestHuman}
                disabled={isSending}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full",
                  "bg-muted hover:bg-muted/80 text-muted-foreground",
                  "transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <User className="w-3 h-3 inline mr-1" />
                Hablar con un agente
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSending}
              rows={1}
              className={cn(
                "flex-1 px-4 py-2.5 text-sm rounded-xl resize-none",
                "bg-muted/50 border border-border/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                "placeholder:text-muted-foreground/70",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[44px] max-h-[120px]"
              )}
              style={{
                height: "44px",
                overflowY: inputValue.split("\n").length > 3 ? "auto" : "hidden",
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                primaryColor && "[background:var(--widget-primary)]"
              )}
              aria-label="Enviar mensaje"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-[10px] text-muted-foreground/70 mt-2 text-center">
            Enter para enviar • Shift+Enter nueva línea
          </p>
        </div>
      ) : (
        <div className="border-t border-border/50 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Esta conversación ha sido cerrada
          </p>
          <button
            onClick={startNewConversation}
            className={cn(
              "text-sm px-4 py-2 rounded-lg",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 transition-colors",
              primaryColor && "[background:var(--widget-primary)]"
            )}
          >
            Iniciar nueva conversación
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;

