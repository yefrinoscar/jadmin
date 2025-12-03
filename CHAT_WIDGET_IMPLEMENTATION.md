# Chat Widget - Guía de Implementación v2.0

Esta guía explica cómo integrar el widget de chat de JAdmin en tu sitio web con la nueva arquitectura de **handoff IA → Humano**.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DEL WIDGET                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   CLIENTE (Widget)                    SERVIDOR (JAdmin)              │
│   ────────────────                    ─────────────────              │
│                                                                      │
│   ┌─────────────┐                     ┌─────────────────┐            │
│   │  Supabase   │◄────────────────────│   PostgreSQL    │            │
│   │  Realtime   │  (solo lectura)     │   + Realtime    │            │
│   └─────────────┘                     └─────────────────┘            │
│         ▲                                     ▲                      │
│         │ INSERT events                       │                      │
│         │                                     │                      │
│   ┌─────────────┐                     ┌─────────────────┐            │
│   │   Widget    │────────────────────►│  POST /api/     │            │
│   │   (React)   │  enviar mensaje     │  chat/public    │            │
│   └─────────────┘                     └─────────────────┘            │
│                                               │                      │
│                                               ▼                      │
│                                       ┌─────────────────┐            │
│                                       │  ¿managed_by    │            │
│                                       │   === 'ai'?     │            │
│                                       └────────┬────────┘            │
│                                                │                     │
│                                    ┌───────────┴───────────┐         │
│                                    │                       │         │
│                                    ▼                       ▼         │
│                              SÍ (IA)               NO (Humano)       │
│                              ───────               ────────────      │
│                                 │                       │            │
│                                 ▼                       ▼            │
│                          ┌───────────┐          ┌───────────┐        │
│                          │ Mistral   │          │  message: │        │
│                          │ responde  │          │   null    │        │
│                          └───────────┘          └───────────┘        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Principios Clave

| Acción | Método | Descripción |
|--------|--------|-------------|
| **Enviar mensaje** | `POST /api/chat/public` | Único endpoint para escribir |
| **Leer mensajes** | Supabase Realtime | Nunca polling, solo suscripción |
| **Handoff** | Automático | Cuando un agente responde, la IA se desactiva |

---

## 📦 Instalación

### Dependencias

```bash
npm install @supabase/supabase-js
# o
yarn add @supabase/supabase-js
# o
pnpm add @supabase/supabase-js
```

---

## ⚙️ Configuración

### 1. Obtener Credenciales de Supabase

```typescript
const JADMIN_URL = 'https://jadmin.tudominio.com';

async function getSupabaseConfig() {
  const response = await fetch(`${JADMIN_URL}/api/chat/public?config=supabase`);
  const config = await response.json();
  return {
    url: config.url,      // URL de Supabase
    anonKey: config.anonKey  // Clave pública (anon key)
  };
}
```

### 2. Inicializar Cliente

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

async function initSupabase() {
  const config = await getSupabaseConfig();
  supabase = createClient(config.url, config.anonKey);
  return supabase;
}
```

---

## 🔌 API Reference

### POST `/api/chat/public`

Endpoint principal para enviar mensajes. Maneja automáticamente:
- Creación de conversaciones
- Guardado de mensajes
- Respuestas de IA (si `managed_by === 'ai'`)
- Extracción de información del visitante

#### Request (Primera vez - sin conversationId)

```typescript
const response = await fetch(`${JADMIN_URL}/api/chat/public`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Hola, necesito ayuda",
    sourceUrl: window.location.href  // Opcional: URL de origen
  })
});
```

#### Request (Mensajes siguientes)

```typescript
const response = await fetch(`${JADMIN_URL}/api/chat/public`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: "uuid-de-la-conversacion",
    message: "Mi nombre es Juan y mi email es juan@email.com"
  })
});
```

#### Response (Modo IA)

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "¡Hola Juan! Gracias por proporcionar tu información...",
  "managedBy": "ai",
  "needsHuman": false,
  "collectedInfo": {
    "name": "Juan",
    "email": "juan@email.com",
    "reason": null
  },
  "infoComplete": false
}
```

#### Response (Modo Humano - después del handoff)

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "message": null,
  "managedBy": "human",
  "awaitingHumanResponse": true
}
```

### GET `/api/chat/public?conversationId={id}`

Obtener historial y estado de una conversación.

#### Response

```json
{
  "messages": [
    {
      "id": "msg-uuid-1",
      "content": "Hola, necesito ayuda",
      "sender_type": "visitor",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "msg-uuid-2", 
      "content": "¡Hola! ¿Podrías indicarme tu nombre?",
      "sender_type": "ai",
      "created_at": "2024-01-15T10:30:01Z"
    }
  ],
  "managedBy": "ai",
  "collectedInfo": { "name": null, "email": null, "reason": null },
  "status": "active"
}
```

---

## 🔄 Realtime - Escuchar Mensajes

### Arquitectura Limpia (Sin Polling)

```typescript
import { useEffect, useState, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  sender_type: 'visitor' | 'ai' | 'agent';
  created_at: string;
}

function useChatMessages(conversationId: string | null, supabase: SupabaseClient | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId || !supabase) return;

    // 1. Cargar historial inicial (UN solo SELECT)
    const loadInitialMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, content, sender_type, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setIsLoading(false);
    };

    loadInitialMessages();

    // 2. Suscribirse a INSERT (sin refetch, actualización directa)
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Evitar duplicados
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    // 3. Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, supabase]);

  return { messages, isLoading };
}
```

### Escuchar Cambios en la Conversación (Handoff)

```typescript
function useConversationStatus(conversationId: string | null, supabase: SupabaseClient | null) {
  const [managedBy, setManagedBy] = useState<'ai' | 'human'>('ai');

  useEffect(() => {
    if (!conversationId || !supabase) return;

    // Cargar estado inicial
    const loadStatus = async () => {
      const { data } = await supabase
        .from('chat_conversations')
        .select('managed_by')
        .eq('id', conversationId)
        .single();

      if (data) {
        setManagedBy(data.managed_by);
      }
    };

    loadStatus();

    // Escuchar cambios (detectar handoff)
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as { managed_by: 'ai' | 'human' };
          setManagedBy(updated.managed_by);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  return { managedBy, isHumanMode: managedBy === 'human' };
}
```

---

## 🎨 Widget Completo (React + TypeScript)

```tsx
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// Configuración
// ============================================================================

const JADMIN_URL = process.env.NEXT_PUBLIC_JADMIN_URL || 'https://jadmin.tudominio.com';

// ============================================================================
// Tipos
// ============================================================================

interface Message {
  id: string;
  content: string;
  sender_type: 'visitor' | 'ai' | 'agent';
  created_at: string;
}

interface CollectedInfo {
  name?: string;
  email?: string;
  reason?: string;
}

interface ConversationState {
  id: string | null;
  managedBy: 'ai' | 'human';
  collectedInfo: CollectedInfo;
  status: 'active' | 'closed';
}

// ============================================================================
// Hook: Supabase Client
// ============================================================================

function useSupabaseClient() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${JADMIN_URL}/api/chat/public?config=supabase`);
        const config = await res.json();
        const client = createClient(config.url, config.anonKey);
        setSupabase(client);
      } catch (error) {
        console.error('Error initializing Supabase:', error);
      }
    };
    init();
  }, []);

  return supabase;
}

// ============================================================================
// Hook: Mensajes en Tiempo Real
// ============================================================================

function useChatMessages(conversationId: string | null, supabase: SupabaseClient | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId || !supabase) {
      setMessages([]);
      return;
    }

    setIsLoading(true);

    // Cargar historial inicial
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, content, sender_type, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setIsLoading(false);
    };

    loadMessages();

    // Suscribirse a nuevos mensajes
    const channel = supabase
      .channel(`widget-messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, supabase]);

  return { messages, isLoading };
}

// ============================================================================
// Hook: Estado de Conversación (detectar handoff)
// ============================================================================

function useConversationState(conversationId: string | null, supabase: SupabaseClient | null) {
  const [state, setState] = useState<ConversationState>({
    id: null,
    managedBy: 'ai',
    collectedInfo: {},
    status: 'active',
  });
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId || !supabase) return;

    setState((prev) => ({ ...prev, id: conversationId }));

    // Cargar estado inicial
    const loadState = async () => {
      const { data } = await supabase
        .from('chat_conversations')
        .select('managed_by, collected_info, status')
        .eq('id', conversationId)
        .single();

      if (data) {
        setState({
          id: conversationId,
          managedBy: data.managed_by || 'ai',
          collectedInfo: data.collected_info || {},
          status: data.status || 'active',
        });
      }
    };

    loadState();

    // Escuchar cambios
    const channel = supabase
      .channel(`widget-conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as {
            managed_by: 'ai' | 'human';
            collected_info: CollectedInfo;
            status: 'active' | 'closed';
          };
          setState({
            id: conversationId,
            managedBy: updated.managed_by,
            collectedInfo: updated.collected_info || {},
            status: updated.status,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, supabase]);

  return state;
}

// ============================================================================
// Componente Principal: ChatWidget
// ============================================================================

export default function ChatWidget() {
  const supabase = useSupabaseClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading } = useChatMessages(conversationId, supabase);
  const conversationState = useConversationState(conversationId, supabase);

  // Auto-scroll cuando llegan mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persistir conversationId en localStorage
  useEffect(() => {
    const stored = localStorage.getItem('jadmin_conversation_id');
    if (stored) {
      setConversationId(stored);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('jadmin_conversation_id', conversationId);
    }
  }, [conversationId]);

  // Enviar mensaje
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch(`${JADMIN_URL}/api/chat/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: messageText,
          sourceUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // El mensaje del visitante y la respuesta de IA llegarán via Realtime
      // No necesitamos hacer nada más aquí
    } catch (error) {
      console.error('Error sending message:', error);
      // Restaurar mensaje si falló
      setInputValue(messageText);
    } finally {
      setIsSending(false);
    }
  };

  // Iniciar nueva conversación
  const startNewConversation = () => {
    localStorage.removeItem('jadmin_conversation_id');
    setConversationId(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          zIndex: 9999,
        }}
      >
        💬
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '380px',
        height: '520px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>Soporte JAdmin</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {conversationState.managedBy === 'human'
              ? '👤 Conectado con un agente'
              : '🤖 Asistente virtual'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {conversationId && (
            <button
              onClick={startNewConversation}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Nueva
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Indicador de handoff */}
      {conversationState.managedBy === 'human' && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          ✅ Un agente de soporte está atendiendo tu consulta
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {!conversationId && messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👋</div>
            <div style={{ fontWeight: 500 }}>¡Hola!</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              Escribe tu mensaje para comenzar
            </div>
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
            Cargando mensajes...
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.sender_type === 'visitor' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '14px',
                lineHeight: '1.4',
                ...(msg.sender_type === 'visitor'
                  ? {
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderBottomRightRadius: '4px',
                    }
                  : msg.sender_type === 'ai'
                  ? {
                      backgroundColor: '#f3e8ff',
                      color: '#6b21a8',
                      borderBottomLeftRadius: '4px',
                    }
                  : {
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      borderBottomLeftRadius: '4px',
                    }),
              }}
            >
              {msg.sender_type !== 'visitor' && (
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    marginBottom: '4px',
                    opacity: 0.8,
                  }}
                >
                  {msg.sender_type === 'ai' ? '🤖 Asistente' : '👤 Agente'}
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              <span style={{ animation: 'pulse 1.5s infinite' }}>●</span>
              <span style={{ animation: 'pulse 1.5s infinite 0.2s' }}>●</span>
              <span style={{ animation: 'pulse 1.5s infinite 0.4s' }}>●</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {conversationState.status === 'active' ? (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isSending}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            style={{
              padding: '10px 16px',
              backgroundColor: inputValue.trim() && !isSending ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: inputValue.trim() && !isSending ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Enviar
          </button>
        </form>
      ) : (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          Esta conversación ha sido cerrada
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 Integración Rápida (Script Embebido)

Para sitios que no usan React, puedes crear un script embebible:

### 1. Crear el archivo del widget

```javascript
// public/widget.js
(function() {
  const JADMIN_URL = 'https://jadmin.tudominio.com';
  
  // Cargar Supabase
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = initWidget;
  document.head.appendChild(script);
  
  async function initWidget() {
    // Obtener config
    const configRes = await fetch(`${JADMIN_URL}/api/chat/public?config=supabase`);
    const config = await configRes.json();
    const supabase = window.supabase.createClient(config.url, config.anonKey);
    
    // Crear UI del widget...
    // (implementación similar al componente React)
  }
})();
```

### 2. Incluir en el sitio

```html
<!-- En cualquier página HTML -->
<script src="https://jadmin.tudominio.com/widget.js"></script>
```

---

## 📱 Variables de Estado Importantes

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `conversationId` | `string \| null` | UUID de la conversación activa |
| `managedBy` | `'ai' \| 'human'` | Quién maneja la conversación |
| `collectedInfo` | `object` | Info recopilada: `{ name, email, reason }` |
| `status` | `'active' \| 'closed'` | Estado de la conversación |

---

## 🔔 Notificaciones

### Detectar mensajes del agente

```typescript
// En el handler de Realtime
.on('postgres_changes', { event: 'INSERT', ... }, (payload) => {
  const newMsg = payload.new as Message;
  
  // Si es mensaje de agente y el widget está cerrado
  if (newMsg.sender_type === 'agent' && !isWidgetOpen) {
    // Mostrar notificación del navegador
    if (Notification.permission === 'granted') {
      new Notification('Nuevo mensaje de soporte', {
        body: newMsg.content.substring(0, 100),
        icon: '/favicon.ico'
      });
    }
    
    // Mostrar badge o indicador visual
    showUnreadIndicator();
  }
})
```

### Solicitar permisos

```typescript
useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);
```

---

## 🎯 Flujo del Handoff

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUJO DE HANDOFF                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. VISITANTE envía mensaje                                     │
│     └─► managed_by = 'ai'                                       │
│     └─► IA responde y recopila info                             │
│                                                                 │
│  2. IA recopila: nombre + email + motivo                        │
│     └─► needs_human_attention = true                            │
│     └─► Aparece en panel de soporte                             │
│                                                                 │
│  3. AGENTE abre el chat en panel de soporte                     │
│     └─► managed_by sigue = 'ai'                                 │
│                                                                 │
│  4. AGENTE envía primer mensaje                                 │
│     └─► 🔄 HANDOFF AUTOMÁTICO                                   │
│     └─► managed_by = 'human'                                    │
│     └─► IA se DESACTIVA para este chat                          │
│                                                                 │
│  5. VISITANTE envía más mensajes                                │
│     └─► POST /api/chat/public                                   │
│     └─► response.message = null (sin IA)                        │
│     └─► response.managedBy = 'human'                            │
│     └─► Mensaje queda esperando respuesta del agente            │
│                                                                 │
│  6. AGENTE responde                                             │
│     └─► Visitante recibe via Realtime                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ❓ FAQ

### ¿Por qué no usar polling para los mensajes?

El polling tiene varios problemas:
- Mayor latencia (delay entre mensaje y visualización)
- Más carga en el servidor
- Mayor consumo de datos del usuario
- No es "tiempo real" verdadero

Con Supabase Realtime, los mensajes llegan **instantáneamente** via WebSocket.

### ¿Cómo sé si un humano está atendiendo?

Observa el campo `managedBy` en la respuesta del POST o en el estado de la conversación:
- `managedBy === 'ai'`: La IA responde automáticamente
- `managedBy === 'human'`: Un agente está atendiendo

### ¿Qué pasa si el agente no responde?

El mensaje del visitante queda guardado y visible en el panel de soporte. El agente puede responder cuando esté disponible, y el visitante recibirá la respuesta via Realtime.

### ¿Puedo personalizar el System Prompt de la IA?

Sí, edita el archivo `lib/ai-provider.ts` en el servidor de JAdmin.

---

## 📄 Licencia

MIT License - JAdmin Chat Widget

