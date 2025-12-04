import { Metadata } from "next";
import { ChatWidget } from "@/components/chat-widget";

export const metadata: Metadata = {
  title: "Chat Widget Demo - JAdmin",
  description: "Demo del widget de chat embebible de JAdmin",
};

export default function WidgetDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Widget Disponible
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Chat Widget{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Demo
            </span>
          </h1>
          <p className="text-lg text-white/70 mb-8">
            Prueba el widget de chat de soporte con IA. Haz clic en el botón flotante en la esquina inferior derecha para comenzar una conversación.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          <FeatureCard
            icon="🤖"
            title="IA Primero"
            description="El asistente virtual atiende primero, recopilando información básica del visitante."
          />
          <FeatureCard
            icon="👤"
            title="Handoff Humano"
            description="Transferencia automática a un agente cuando se necesita atención personalizada."
          />
          <FeatureCard
            icon="⚡"
            title="Tiempo Real"
            description="Mensajes instantáneos con Supabase Realtime, sin necesidad de refrescar."
          />
        </div>

        {/* Code Example */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Integración Rápida
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* React/Next.js */}
            <CodeBlock
              title="React / Next.js"
              language="tsx"
              code={`import { ChatWidget } from '@/components/chat-widget';

export default function Page() {
  return (
    <div>
      <h1>Mi Landing Page</h1>
      
      {/* Widget de chat */}
      <ChatWidget
        title="Soporte"
        primaryColor="#6366f1"
        position="bottom-right"
      />
    </div>
  );
}`}
            />
            
            {/* Vanilla HTML */}
            <CodeBlock
              title="HTML / JavaScript"
              language="html"
              code={`<!-- Configuración (opcional) -->
<script>
  window.JAdminChatConfig = {
    apiUrl: 'https://tu-jadmin.com',
    title: 'Soporte',
    primaryColor: '#6366f1'
  };
</script>

<!-- Cargar widget -->
<script src="https://tu-jadmin.com/chat-widget.js"></script>`}
            />
          </div>
        </div>

        {/* Options Table */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Opciones de Configuración
          </h2>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">Opción</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Tipo</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Default</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <OptionRow name="apiUrl" type="string" def="window.location.origin" desc="URL del backend de JAdmin" />
                <OptionRow name="title" type="string" def="Soporte" desc="Título del widget" />
                <OptionRow name="primaryColor" type="string" def="#6366f1" desc="Color principal del widget" />
                <OptionRow name="position" type="string" def="bottom-right" desc="Posición: bottom-right | bottom-left" />
                <OptionRow name="welcomeMessage" type="string" def="¡Hola! 👋..." desc="Mensaje de bienvenida" />
                <OptionRow name="placeholder" type="string" def="Escribe tu mensaje..." desc="Placeholder del input" />
                <OptionRow name="defaultOpen" type="boolean" def="false" desc="Abrir widget por defecto" />
                <OptionRow name="zIndex" type="number" def="9999" desc="Z-index del widget" />
              </tbody>
            </table>
          </div>
        </div>

        {/* API Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            API JavaScript (Script embebido)
          </h2>
          
          <CodeBlock
            title="Control del Widget"
            language="javascript"
            code={`// Abrir widget
JAdminChat.open();

// Cerrar widget
JAdminChat.close();

// Toggle (abrir/cerrar)
JAdminChat.toggle();

// Nueva conversación
JAdminChat.newConversation();

// Enviar mensaje programáticamente
JAdminChat.sendMessage('Hola, necesito ayuda');`}
          />
        </div>
      </div>

      {/* The actual widget */}
      <ChatWidget
        title="Soporte JAdmin"
        subtitleAI="Asistente Virtual"
        subtitleHuman="Agente de Soporte"
        welcomeMessage="¡Hola! 👋 Soy el asistente virtual de JAdmin. ¿En qué puedo ayudarte hoy?"
        position="bottom-right"
      />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  );
}

function CodeBlock({ title, language, code }: { title: string; language: string; code: string }) {
  return (
    <div className="bg-slate-950 rounded-xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <span className="text-white/80 text-sm font-medium">{title}</span>
        <span className="text-xs text-white/40 font-mono">{language}</span>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-emerald-400 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function OptionRow({ name, type, def, desc }: { name: string; type: string; def: string; desc: string }) {
  return (
    <tr className="text-white/70">
      <td className="px-6 py-3 font-mono text-purple-400">{name}</td>
      <td className="px-6 py-3 font-mono text-emerald-400">{type}</td>
      <td className="px-6 py-3 font-mono text-amber-400">{def}</td>
      <td className="px-6 py-3">{desc}</td>
    </tr>
  );
}

