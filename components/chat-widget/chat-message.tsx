"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "./use-chat-widget";

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
}

export function ChatMessageItem({ message, isOwnMessage, showHeader }: ChatMessageItemProps) {
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

  return (
    <div className={cn("flex mt-2", isOwnMessage ? "justify-end" : "justify-start")}>
      <div
        className={cn("max-w-[80%] w-fit flex flex-col gap-1", {
          "items-end": isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn("flex items-center gap-1.5 text-[10px] px-2", {
              "justify-end flex-row-reverse": isOwnMessage,
            })}
          >
            {getSenderIcon() && <span>{getSenderIcon()}</span>}
            <span className="font-medium text-muted-foreground">{getSenderLabel()}</span>
            <span className="text-muted-foreground/70">
              {new Date(message.created_at).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            "py-2.5 px-3.5 rounded-2xl text-sm leading-relaxed",
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-br-md"
              : isAI
              ? "bg-violet-100 dark:bg-violet-950 text-violet-900 dark:text-violet-100 rounded-bl-md"
              : isAgent
              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 rounded-bl-md"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

// Typing indicator component
export function TypingIndicator() {
  return (
    <div className="flex justify-start mt-2">
      <div className="bg-muted py-3 px-4 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}

