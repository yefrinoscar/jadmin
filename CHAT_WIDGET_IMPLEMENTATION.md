# Chat Widget - Guía de Implementación

Esta guía explica cómo integrar el widget de chat de JAdmin en tu sitio web.

---

## Configuración

### URL del API

Configura la URL base del servidor JAdmin:

```typescript
const CHAT_API_URL = 'https://jadmin.tudominio.com';
```

O usando variables de entorno:

```env
NEXT_PUBLIC_CHAT_API_URL=https://jadmin.tudominio.com
```

---

## API Endpoints

### POST `/api/chat/public`

Envía un mensaje y recibe respuesta de la IA.

**Endpoint completo**: `https://jadmin.tudominio.com/api/chat/public`

**Request (Primer mensaje - cuando aún no tienes conversationId)**:

```json
{
  "message": "Hola, necesito ayuda",
  "sourceUrl": "https://tusitio.com/pagina"
}
```

**Request (Mensajes siguientes - cuando ya tienes conversationId)**:

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Gracias por la respuesta"
}
```

**Request (Con información del usuario - opcional, cuando la tengas)**:

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Mi nombre es Juan Pérez",
  "visitorName": "Juan Pérez",
  "visitorEmail": "juan@email.com",
  "visitorPhone": "+52 555 123 4567"
}
```

**Nota**: Los campos `visitorName`, `visitorEmail` y `visitorPhone` son **opcionales**. La IA los pedirá durante la conversación. Cuando los tengas, inclúyelos en las peticiones para actualizar la conversación.

**Response**:

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Respuesta de la IA...",
  "needsHuman": false
}
```

**Campos importantes**:
- `conversationId`: UUID - **Guarda esto para mensajes siguientes**
- `message`: Texto de la respuesta de la IA
- `needsHuman`: Boolean - Si es `true`, un agente responderá pronto

**Nota**: La IA pedirá `visitorName` y `visitorEmail` de forma conversacional. Debes enviarlos cuando los tengas.

### GET `/api/chat/public?conversationId=xxx`

Obtiene el historial completo de mensajes (incluye respuestas de agentes).

**Endpoint completo**: `https://jadmin.tudominio.com/api/chat/public?conversationId=550e8400-e29b-41d4-a716-446655440000`

**Response**:

```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "Mensaje del visitante",
      "sender_type": "visitor",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "content": "Respuesta de la IA",
      "sender_type": "ai",
      "ai_model": "mistral-small",
      "created_at": "2025-01-15T10:30:05Z"
    },
    {
      "id": "uuid",
      "content": "Respuesta del agente",
      "sender_type": "agent",
      "created_at": "2025-01-15T10:35:00Z"
    }
  ]
}
```

**sender_type valores**:
- `visitor`: Mensaje del usuario
- `ai`: Respuesta generada por IA
- `agent`: Respuesta de un agente humano

---

## Implementación del Widget

### Componente Básico

```tsx
import { useState, useEffect } from 'react';

const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || 'https://jadmin.tudominio.com';

interface Message {
  id: string;
  content: string;
  sender_type: 'visitor' | 'ai' | 'agent';
  created_at: string;
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsHuman, setNeedsHuman] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  // Enviar mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Agregar mensaje del usuario inmediatamente
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: userMessage,
      sender_type: 'visitor',
      created_at: new Date().toISOString(),
    }]);

    try {
      // Preparar body - incluir información del usuario solo si la tienes
      const body: Record<string, string> = {
        message: userMessage,
        sourceUrl: window.location.href,
      };

      if (conversationId) {
        body.conversationId = conversationId;
      }

      // Incluir información del usuario si la tienes (opcional)
      if (userInfo.name) body.visitorName = userInfo.name;
      if (userInfo.email) body.visitorEmail = userInfo.email;
      if (userInfo.phone) body.visitorPhone = userInfo.phone;

      const response = await fetch(`${CHAT_API_URL}/api/chat/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      const data = await response.json();

      // Agregar respuesta de la IA
      setMessages(prev => [...prev, {
        id: data.conversationId + '-ai-' + Date.now(),
        content: data.message,
        sender_type: 'ai',
        created_at: new Date().toISOString(),
      }]);

      // Guardar conversationId para mensajes siguientes
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      // Actualizar información del usuario si la IA la menciona o la extraes de las respuestas
      // La IA pedirá nombre y email, tú decides cómo extraerlos y guardarlos en userInfo
      
      setNeedsHuman(data.needsHuman);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        content: 'Error al enviar mensaje. Por favor intenta de nuevo.',
        sender_type: 'ai',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling para respuestas de agentes (cuando needsHuman es true)
  useEffect(() => {
    if (!conversationId || !needsHuman) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${CHAT_API_URL}/api/chat/public?conversationId=${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          const currentIds = new Set(messages.map(m => m.id));
          
          // Buscar nuevos mensajes de agentes
          const newMessages = data.messages.filter((m: Message) => 
            m.sender_type === 'agent' && !currentIds.has(m.id)
          );
          
          if (newMessages.length > 0) {
            setMessages(prev => [...prev, ...newMessages]);
            setNeedsHuman(false); // Agente respondió
          }
        }
      } catch (error) {
        console.error('Error polling:', error);
      }
    }, 5000); // Poll cada 5 segundos

    return () => clearInterval(interval);
  }, [conversationId, needsHuman, messages]);

  return (
    <div className="chat-widget">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender_type}`}>
            <div className="message-header">
              <span>
                {msg.sender_type === 'visitor' && 'Tú'}
                {msg.sender_type === 'ai' && 'Asistente IA'}
                {msg.sender_type === 'agent' && 'Agente'}
              </span>
              <span className="time">
                {new Date(msg.created_at).toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {isLoading && <div className="typing-indicator">Escribiendo...</div>}
      </div>

      {needsHuman && (
        <div className="notice">
          Un agente te contactará pronto
        </div>
      )}

      <form onSubmit={handleSendMessage} className="chat-input">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
```

---

## Flujo de Implementación

### 1. Usuario envía primer mensaje (sin información)

```typescript
// Usuario escribe: "Hola"
// Envías al API:
POST /api/chat/public
{
  "message": "Hola",
  "sourceUrl": "https://tusitio.com"
}

// Respuesta:
{
  "conversationId": "uuid-here",
  "message": "¡Hola! Para poder ayudarte mejor, ¿podrías decirme tu nombre?",
  "needsHuman": false
}
```

### 2. Usuario proporciona nombre

```typescript
// Usuario escribe: "Juan Pérez"
// Opcionalmente extraes y guardas: userInfo.name = "Juan Pérez"
// Envías al API:
POST /api/chat/public
{
  "conversationId": "uuid-here",
  "message": "Juan Pérez"
  // Opcional: "visitorName": "Juan Pérez" si quieres actualizar la conversación
}

// Respuesta:
{
  "conversationId": "uuid-here",
  "message": "Gracias Juan. Ahora, ¿podrías proporcionarme tu email?",
  "needsHuman": false
}
```

### 3. Usuario proporciona email

```typescript
// Usuario escribe: "juan@email.com"
// Opcionalmente extraes y guardas: userInfo.email = "juan@email.com"
// Envías al API:
POST /api/chat/public
{
  "conversationId": "uuid-here",
  "message": "juan@email.com"
  // Opcional: "visitorEmail": "juan@email.com" si quieres actualizar la conversación
}

// Respuesta:
{
  "conversationId": "uuid-here",
  "message": "Perfecto Juan. ¿En qué puedo ayudarte hoy?",
  "needsHuman": false
}
```

### 4. Usuario hace consulta técnica

```typescript
// Usuario escribe: "Tengo un problema con mi cuenta"
// Envías al API:
POST /api/chat/public
{
  "conversationId": "uuid-here",
  "message": "Tengo un problema con mi cuenta"
  // Opcional: puedes incluir visitorName y visitorEmail si los tienes
}

// Respuesta:
{
  "conversationId": "uuid-here",
  "message": "Entiendo tu problema. Te puedo ayudar con...",
  "needsHuman": false
}
```

### 5. Si necesita atención humana

```typescript
// Respuesta del API:
{
  "conversationId": "uuid-here",
  "message": "Este caso requiere atención especializada. Un agente revisará tu solicitud.",
  "needsHuman": true  // ← Importante: activa polling
}

// Inicias polling cada 5 segundos:
GET /api/chat/public?conversationId=uuid-here

// Cuando el agente responda, recibirás:
{
  "messages": [
    // ... mensajes anteriores ...
    {
      "id": "new-uuid",
      "content": "Hola Juan, soy el agente. Te puedo ayudar con...",
      "sender_type": "agent",  // ← Nuevo mensaje de agente
      "created_at": "2025-01-15T10:35:00Z"
    }
  ]
}
```

---

## Checklist de Implementación

- [ ] Configurar URL del API de JAdmin
- [ ] Implementar función para enviar mensajes (POST)
- [ ] Enviar primer mensaje sin requerir información del usuario
- [ ] Guardar `conversationId` de la primera respuesta
- [ ] Incluir `conversationId` en todos los mensajes siguientes
- [ ] (Opcional) Extraer `visitorName` y `visitorEmail` cuando el usuario los proporcione
- [ ] (Opcional) Incluir `visitorName` y `visitorEmail` en las peticiones cuando los tengas
- [ ] Mostrar respuestas de la IA
- [ ] Verificar flag `needsHuman` en cada respuesta
- [ ] Iniciar polling (GET) cada 5 segundos cuando `needsHuman` es `true`
- [ ] Detener polling cuando recibas respuesta de agente
- [ ] Mostrar mensajes de agentes cuando lleguen
- [ ] Manejar errores de red

---

## Notas Importantes

1. **No se requiere información del usuario desde el inicio** - puedes empezar el chat sin `visitorName` ni `visitorEmail`
2. **La IA pedirá nombre y email** de forma conversacional durante la conversación
3. **Los campos `visitorName`, `visitorEmail` y `visitorPhone` son opcionales** - inclúyelos cuando los tengas para actualizar la conversación
4. **Guarda el `conversationId`** de la primera respuesta y úsalo en todos los mensajes siguientes
5. **Puedes actualizar la información** enviando `visitorName`/`visitorEmail` en cualquier mensaje posterior
6. **Polling solo cuando `needsHuman` es `true`** - no necesitas hacerlo constantemente
7. **CORS está habilitado** - puedes llamar desde cualquier dominio
8. **Usa URLs absolutas** - no rutas relativas

---

## Ejemplo Mínimo Funcional

```tsx
import { useState } from 'react';

const API_URL = 'https://jadmin.tudominio.com';

export default function ChatWidget() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setLoading(true);
    
    // Agregar mensaje del usuario
    setMessages(prev => [...prev, { content: userMsg, sender_type: 'visitor' }]);
    
    try {
      // Preparar body - solo incluir conversationId si lo tienes
      const body: Record<string, string> = {
        message: userMsg,
        sourceUrl: window.location.href,
      };
      
      if (conversationId) {
        body.conversationId = conversationId;
      }
      
      // Opcional: Si extraes nombre/email de las respuestas, inclúyelos aquí
      // body.visitorName = "Juan Pérez";
      // body.visitorEmail = "juan@email.com";
      
      const res = await fetch(`${API_URL}/api/chat/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      // Guardar conversationId
      if (!conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Agregar respuesta de la IA
      setMessages(prev => [...prev, { 
        content: data.message, 
        sender_type: 'ai' 
      }]);
      
    } catch (error) {
      alert('Error al enviar mensaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i} className={msg.sender_type}>
            {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={loading}
        />
        <button disabled={loading}>Enviar</button>
      </form>
    </div>
  );
}
```

---

## Soporte

Para dudas o problemas, contacta al equipo de JAdmin.
