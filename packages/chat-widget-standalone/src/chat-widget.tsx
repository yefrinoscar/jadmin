"use client";

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { useChatWidget, type UseChatWidgetOptions, type ChatMessage } from "./use-chat-widget";

// ============================================================================
// Utility: cn (class names merger)
// ============================================================================

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// Types
// ============================================================================

export interface ChatWidgetProps {
  /** URL del API de JAdmin (ej: https://jadmin.tudominio.com) */
  apiUrl: string;
  /** URL de Supabase (opcional) */
  supabaseUrl?: string;
  /** Anon Key de Supabase (opcional) */
  supabaseAnonKey?: string;
  /** Título del widget */
  title?: string;
  /** Subtítulo cuando la IA responde */
  subtitleAI?: string;
  /** Subtítulo cuando un humano responde */
  subtitleHuman?: string;
  /** Color principal (hex) */
  primaryColor?: string;
  /** Mensaje de bienvenida */
  welcomeMessage?: string;
  /** Placeholder del input */
  placeholder?: string;
  /** Posición del widget */
  position?: "bottom-right" | "bottom-left";
  /** Abierto por defecto */
  defaultOpen?: boolean;
  /** Z-index del widget */
  zIndex?: number;
  /** Callback al abrir */
  onOpen?: () => void;
  /** Callback al cerrar */
  onClose?: () => void;
}

// ============================================================================
// Icons (inline SVG)
// ============================================================================

const Icons = {
  MessageCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
  ),
  RotateCcw: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Bot: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
    </svg>
  ),
  Wifi: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>
    </svg>
  ),
  WifiOff: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><line x1="12" x2="12.01" y1="20" y2="20"/>
    </svg>
  ),
  Sparkles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  ),
};

// ============================================================================
// Message Component
// ============================================================================

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
  primaryColor?: string;
}

function ChatMessageItem({ message, isOwnMessage, showHeader, primaryColor }: ChatMessageItemProps) {
  const isAI = message.sender_type === "ai";
  const isAgent = message.sender_type === "agent";

  const getSenderLabel = () => {
    if (isOwnMessage) return "Tú";
    if (isAI) return "Asistente";
    if (isAgent) return "Agente";
    return "Usuario";
  };

  const getSenderIcon = () => {
    if (isOwnMessage) return null;
    if (isAI) return "🤖";
    if (isAgent) return "👤";
    return "💬";
  };

  const bubbleStyle: React.CSSProperties = isOwnMessage && primaryColor
    ? { backgroundColor: primaryColor, color: "#ffffff" }
    : {};

  return (
    <div style={{ display: "flex", marginTop: "8px", justifyContent: isOwnMessage ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: "4px", alignItems: isOwnMessage ? "flex-end" : "flex-start" }}>
        {showHeader && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", padding: "0 8px", flexDirection: isOwnMessage ? "row-reverse" : "row" }}>
            {getSenderIcon() && <span>{getSenderIcon()}</span>}
            <span style={{ fontWeight: 500, color: "#9ca3af" }}>{getSenderLabel()}</span>
            <span style={{ color: "#9ca3af", opacity: 0.7 }}>
              {new Date(message.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "16px",
            fontSize: "14px",
            lineHeight: "1.5",
            wordBreak: "break-word",
            ...(isOwnMessage
              ? { backgroundColor: primaryColor || "#6366f1", color: "#ffffff", borderBottomRightRadius: "4px" }
              : isAI
              ? { backgroundColor: "#f3e8ff", color: "#6b21a8", borderBottomLeftRadius: "4px" }
              : isAgent
              ? { backgroundColor: "#dcfce7", color: "#166534", borderBottomLeftRadius: "4px" }
              : { backgroundColor: "#f3f4f6", color: "#1f2937", borderBottomLeftRadius: "4px" }),
            ...bubbleStyle,
          }}
        >
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.content}</p>
        </div>
      </div>
    </div>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "8px" }}>
      <div style={{ backgroundColor: "#f3f4f6", padding: "12px 16px", borderRadius: "16px", borderBottomLeftRadius: "4px" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", backgroundColor: "#9ca3af", borderRadius: "50%", animation: "jadmin-bounce 1.4s infinite" }} />
          <span style={{ width: "8px", height: "8px", backgroundColor: "#9ca3af", borderRadius: "50%", animation: "jadmin-bounce 1.4s infinite 0.2s" }} />
          <span style={{ width: "8px", height: "8px", backgroundColor: "#9ca3af", borderRadius: "50%", animation: "jadmin-bounce 1.4s infinite 0.4s" }} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Widget Component
// ============================================================================

export function ChatWidget({
  apiUrl,
  supabaseUrl,
  supabaseAnonKey,
  title = "Soporte",
  subtitleAI = "Asistente Virtual",
  subtitleHuman = "Agente de Soporte",
  primaryColor = "#6366f1",
  welcomeMessage = "¡Hola! 👋 ¿En qué puedo ayudarte hoy?",
  placeholder = "Escribe tu mensaje...",
  position = "bottom-right",
  defaultOpen = false,
  zIndex = 9999,
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Inject animation styles
  useEffect(() => {
    const styleId = "jadmin-widget-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes jadmin-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes jadmin-slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) onOpen?.();
    else onClose?.();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;
    const message = inputValue.trim();
    setInputValue("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const positionStyle: React.CSSProperties = position === "bottom-left"
    ? { left: "24px" }
    : { right: "24px" };

  // Floating button
  if (!isOpen) {
    return (
      <button
        onClick={handleToggle}
        style={{
          position: "fixed",
          bottom: "24px",
          ...positionStyle,
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: primaryColor,
          color: "#ffffff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          zIndex,
        }}
        aria-label="Abrir chat"
      >
        <Icons.MessageCircle />
        <span style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "12px",
          height: "12px",
          backgroundColor: "#10b981",
          borderRadius: "50%",
          animation: "jadmin-bounce 2s infinite",
        }} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        ...positionStyle,
        width: "400px",
        maxWidth: "calc(100vw - 32px)",
        height: "600px",
        maxHeight: "calc(100vh - 100px)",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        animation: "jadmin-slide-in 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          backgroundColor: primaryColor,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}>
            {isHumanMode ? <Icons.User /> : <Icons.Bot />}
            <span style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              border: `2px solid ${primaryColor}`,
              backgroundColor: isConnected ? "#10b981" : "#f59e0b",
            }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "15px" }}>{title}</div>
            <div style={{ fontSize: "12px", opacity: 0.9, display: "flex", alignItems: "center", gap: "4px" }}>
              {isHumanMode ? <Icons.User /> : <Icons.Sparkles />}
              <span style={{ marginLeft: "2px" }}>{isHumanMode ? subtitleHuman : subtitleAI}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => {}} title={isConnected ? "Conectado" : "Reconectando..."} style={{
            width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.1)",
            border: "none", color: "#fff", cursor: "default", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {isConnected ? <Icons.Wifi /> : <Icons.WifiOff />}
          </button>
          {conversationState.id && (
            <button onClick={startNewConversation} title="Nueva conversación" style={{
              width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.1)",
              border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Icons.RotateCcw />
            </button>
          )}
          <button onClick={handleToggle} title="Cerrar" style={{
            width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.1)",
            border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Icons.X />
          </button>
        </div>
      </div>

      {/* Handoff indicator */}
      {isHumanMode && (
        <div style={{
          padding: "10px 16px",
          backgroundColor: "#dcfce7",
          color: "#166534",
          fontSize: "12px",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}>
          <Icons.User /> Un agente está atendiendo tu consulta
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: "10px 16px", backgroundColor: "#fee2e2", color: "#dc2626", fontSize: "12px", textAlign: "center" }}>
          {error}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Welcome */}
        {!conversationState.id && messages.length === 0 && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              backgroundColor: `${primaryColor}15`, color: primaryColor,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px"
            }}>
              <Icons.MessageCircle />
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", margin: "0 0 8px 0" }}>¡Bienvenido!</h4>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, maxWidth: "260px" }}>{welcomeMessage}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
            <TypingIndicator />
          </div>
        )}

        {/* Messages list */}
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showHeader = !prevMessage || prevMessage.sender_type !== message.sender_type ||
            new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 60000;

          return (
            <ChatMessageItem
              key={message.id}
              message={message}
              isOwnMessage={message.sender_type === "visitor"}
              showHeader={showHeader}
              primaryColor={primaryColor}
            />
          );
        })}

        {isSending && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isClosed ? (
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
          {!isHumanMode && messages.length > 2 && (
            <div style={{ marginBottom: "10px" }}>
              <button
                onClick={requestHuman}
                disabled={isSending}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "6px 12px", backgroundColor: "#f3f4f6", border: "none",
                  borderRadius: "20px", fontSize: "12px", color: "#6b7280", cursor: "pointer"
                }}
              >
                <Icons.User /> Hablar con un agente
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSending}
              rows={1}
              style={{
                flex: 1, padding: "12px 16px", border: "1px solid #e5e7eb",
                borderRadius: "12px", fontSize: "14px", resize: "none",
                outline: "none", fontFamily: "inherit", backgroundColor: "#f9fafb",
                minHeight: "44px", maxHeight: "120px"
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending}
              style={{
                width: "44px", height: "44px", borderRadius: "12px",
                backgroundColor: !inputValue.trim() || isSending ? "#9ca3af" : primaryColor,
                color: "#ffffff", border: "none",
                cursor: !inputValue.trim() || isSending ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <Icons.Send />
            </button>
          </form>
          <p style={{ fontSize: "10px", color: "#9ca3af", textAlign: "center", marginTop: "8px" }}>
            Enter para enviar • Shift+Enter nueva línea
          </p>
        </div>
      ) : (
        <div style={{ padding: "24px 16px", textAlign: "center", borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 12px 0" }}>
            Esta conversación ha sido cerrada
          </p>
          <button
            onClick={startNewConversation}
            style={{
              padding: "10px 20px", backgroundColor: primaryColor, color: "#ffffff",
              border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer"
            }}
          >
            Iniciar nueva conversación
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;

