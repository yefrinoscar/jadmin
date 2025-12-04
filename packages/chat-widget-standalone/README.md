# @jadmin/chat-widget

Widget de chat embebible para JAdmin con soporte de IA y handoff a agentes humanos.

## Instalación

### Opción 1: Copiar archivos (recomendado para proyectos pequeños)

Copia la carpeta `packages/chat-widget-standalone/src` a tu proyecto:

```bash
# Estructura en tu proyecto
src/
  components/
    chat-widget/
      index.ts
      chat-widget.tsx
      use-chat-widget.ts
```

Instala la dependencia de Supabase:

```bash
npm install @supabase/supabase-js
# o
yarn add @supabase/supabase-js
# o
pnpm add @supabase/supabase-js
```

### Opción 2: Publicar como paquete NPM

```bash
cd packages/chat-widget-standalone
npm install
npm run build
npm publish
```

Luego en tu proyecto:

```bash
npm install @jadmin/chat-widget
```

## Uso

### React / Next.js

```tsx
import { ChatWidget } from './components/chat-widget';
// o si publicaste en NPM:
// import { ChatWidget } from '@jadmin/chat-widget';

export default function MiLandingPage() {
  return (
    <div>
      <h1>Mi Sitio Web</h1>
      
      {/* Widget de chat */}
      <ChatWidget
        apiUrl="https://tu-jadmin.com"
        title="Soporte"
        primaryColor="#6366f1"
        position="bottom-right"
        welcomeMessage="¡Hola! ¿En qué puedo ayudarte?"
      />
    </div>
  );
}
```

### HTML / JavaScript (Script embebido)

Si no usas React, puedes usar el script embebible:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mi Sitio</title>
</head>
<body>
  <h1>Mi Sitio Web</h1>

  <!-- Configuración del widget -->
  <script>
    window.JAdminChatConfig = {
      apiUrl: 'https://tu-jadmin.com',
      title: 'Soporte',
      primaryColor: '#6366f1',
      welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
      position: 'bottom-right'
    };
  </script>
  
  <!-- Cargar el widget -->
  <script src="https://tu-jadmin.com/chat-widget.js"></script>
</body>
</html>
```

## Props / Opciones

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `apiUrl` | `string` | **requerido** | URL de tu instalación de JAdmin |
| `supabaseUrl` | `string` | - | URL de Supabase (opcional, se obtiene del API) |
| `supabaseAnonKey` | `string` | - | Anon Key de Supabase (opcional) |
| `title` | `string` | `"Soporte"` | Título del widget |
| `subtitleAI` | `string` | `"Asistente Virtual"` | Subtítulo cuando la IA responde |
| `subtitleHuman` | `string` | `"Agente de Soporte"` | Subtítulo cuando un humano responde |
| `primaryColor` | `string` | `"#6366f1"` | Color principal (hex) |
| `welcomeMessage` | `string` | `"¡Hola! 👋..."` | Mensaje de bienvenida |
| `placeholder` | `string` | `"Escribe tu mensaje..."` | Placeholder del input |
| `position` | `string` | `"bottom-right"` | `"bottom-right"` o `"bottom-left"` |
| `defaultOpen` | `boolean` | `false` | Si el widget inicia abierto |
| `zIndex` | `number` | `9999` | Z-index del widget |
| `onOpen` | `function` | - | Callback cuando se abre el widget |
| `onClose` | `function` | - | Callback cuando se cierra el widget |

## Hook personalizado

Si quieres crear tu propia UI, puedes usar el hook `useChatWidget`:

```tsx
import { useChatWidget } from './components/chat-widget';

function MiChatPersonalizado() {
  const {
    messages,           // Array de mensajes
    conversationState,  // { id, managedBy, collectedInfo, status }
    isLoading,          // Cargando historial
    isSending,          // Enviando mensaje
    isConnected,        // Conexión realtime activa
    sendMessage,        // Función para enviar mensaje
    requestHuman,       // Solicitar agente humano
    startNewConversation, // Iniciar nueva conversación
    error,              // Mensaje de error
  } = useChatWidget({
    apiUrl: 'https://tu-jadmin.com',
  });

  return (
    <div>
      {/* Tu UI personalizada */}
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.sender_type}:</strong> {msg.content}
        </div>
      ))}
      
      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

## API JavaScript (Script embebido)

Cuando usas el script embebido, tienes acceso a la API global:

```javascript
// Abrir el widget
JAdminChat.open();

// Cerrar el widget
JAdminChat.close();

// Toggle (abrir/cerrar)
JAdminChat.toggle();

// Iniciar nueva conversación
JAdminChat.newConversation();

// Enviar mensaje programáticamente
JAdminChat.sendMessage('Hola, necesito ayuda');
```

## Flujo de la conversación

```
1. Usuario abre el widget
   ↓
2. Usuario envía mensaje
   ↓
3. IA responde y recopila información (nombre, email, motivo)
   ↓
4. Usuario puede solicitar "Hablar con un agente"
   ↓
5. Conversación marcada para atención humana
   ↓
6. Agente responde desde el panel de JAdmin
   ↓
7. HANDOFF: La IA se desactiva, el agente toma el control
   ↓
8. Toda la conversación continúa en tiempo real
```

## Requisitos del servidor

Tu instalación de JAdmin debe tener:

1. El endpoint `/api/chat/public` accesible (con CORS habilitado)
2. Supabase configurado con Realtime habilitado
3. Las tablas `chat_conversations` y `chat_messages` creadas

## Soporte

¿Problemas? Revisa:

1. Que `apiUrl` apunte correctamente a tu JAdmin
2. Que CORS esté configurado en tu JAdmin para permitir tu dominio
3. La consola del navegador para errores

