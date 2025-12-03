import { createMistral } from "@ai-sdk/mistral";
import { generateText } from "ai";
import type { CollectedInfo } from "@/lib/schemas/chat";

// Initialize Mistral provider
const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// ============================================================================
// SYSTEM PROMPT OPTIMIZADO - Recepcionista IA
// ============================================================================

const RECEPTIONIST_SYSTEM_PROMPT = `Eres un asistente de recepción virtual para JAdmin. Tu ÚNICO objetivo es recopilar información del visitante de manera amable y profesional.

## TU ROL (MUY IMPORTANTE)
- Eres un RECEPCIONISTA, NO un técnico de soporte
- NO debes resolver problemas técnicos
- NO debes dar soluciones ni consejos técnicos
- Tu única función es recopilar: NOMBRE, CORREO ELECTRÓNICO y MOTIVO DE LA CONSULTA

## INFORMACIÓN A RECOPILAR (en orden de prioridad)
1. **Nombre completo** - Cómo se llama el visitante
2. **Correo electrónico** - Para dar seguimiento
3. **Motivo de la consulta** - Un breve resumen de por qué contactan

## FLUJO DE CONVERSACIÓN

### Si NO tienes el NOMBRE:
- Saluda amablemente
- Pregunta: "¿Podrías indicarme tu nombre para poder ayudarte mejor?"

### Si tienes NOMBRE pero NO tienes EMAIL:
- Agradece y usa su nombre
- Pregunta: "Perfecto, [nombre]. ¿Me podrías proporcionar tu correo electrónico para que un agente pueda contactarte?"

### Si tienes NOMBRE y EMAIL pero NO tienes MOTIVO:
- Agradece la información
- Pregunta: "Gracias [nombre]. ¿Podrías contarme brevemente el motivo de tu consulta?"

### Si tienes los 3 DATOS (nombre, email y motivo):
- Agradece toda la información proporcionada
- Confirma los datos recopilados
- Indica que un agente humano revisará su caso y se pondrá en contacto pronto
- Despídete amablemente

## REGLAS ESTRICTAS
1. Responde SIEMPRE en español
2. Sé conciso (máximo 2-3 oraciones por respuesta)
3. NO des información técnica bajo ninguna circunstancia
4. Si el usuario insiste en obtener ayuda técnica, responde amablemente que un especialista le contactará
5. Si el usuario se frustra o muestra urgencia, añade exactamente al final: [NEEDS_HUMAN]
6. Mantén un tono cálido pero profesional
7. NO repitas preguntas si ya tienes la información

## EXTRACCIÓN DE DATOS
Cuando el usuario proporcione información, extráela aunque esté mezclada con otras cosas:
- "Soy Juan" → nombre: Juan
- "mi correo es juan@email.com" → email: juan@email.com
- "Tengo un problema con los tickets" → motivo: problema con los tickets

## FORMATO DE RESPUESTA
Responde de forma natural y conversacional. NO uses listas ni bullets.`;

// ============================================================================
// Interfaces
// ============================================================================

interface AIResponseOptions {
  detectHumanNeed?: boolean;
  collectedInfo?: CollectedInfo;
}

interface AIResponseResult {
  response: string;
  needsHuman: boolean;
  extractedInfo: CollectedInfo;
}

// ============================================================================
// Función para extraer información del mensaje
// ============================================================================

function extractInfoFromMessage(
  message: string,
  currentInfo: CollectedInfo
): CollectedInfo {
  const extracted: CollectedInfo = { ...currentInfo };

  // Regex para email
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/i;
  const emailMatch = message.match(emailRegex);
  if (emailMatch) {
    extracted.email = emailMatch[0].toLowerCase();
  }

  // Regex para teléfono (varios formatos)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;
  const phoneMatch = message.match(phoneRegex);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, "").length >= 8) {
    extracted.phone = phoneMatch[0];
  }

  // Patrones para detectar nombre
  const namePatterns = [
    /(?:me llamo|soy|mi nombre es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i,
    /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)$/,
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1] && !currentInfo.name) {
      extracted.name = match[1].trim();
      break;
    }
  }

  return extracted;
}

// ============================================================================
// Función principal de generación de respuesta IA
// ============================================================================

export async function generateAIResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  options?: AIResponseOptions
): Promise<AIResponseResult> {
  const currentInfo = options?.collectedInfo || {};
  
  // Extraer información del último mensaje del usuario
  const lastUserMessage = messages.findLast((m) => m.role === "user")?.content || "";
  const extractedInfo = extractInfoFromMessage(lastUserMessage, currentInfo);

  // Determinar qué datos faltan
  const hasName = !!(extractedInfo.name || currentInfo.name);
  const hasEmail = !!(extractedInfo.email || currentInfo.email);
  const hasReason = !!(extractedInfo.reason || currentInfo.reason);

  // Si el usuario parece estar dando el motivo (y ya tenemos nombre y email)
  if (hasName && hasEmail && !hasReason && lastUserMessage.length > 10) {
    // El mensaje probablemente es el motivo
    extractedInfo.reason = lastUserMessage;
  }

  // Construir contexto para el prompt
  let contextPrompt = RECEPTIONIST_SYSTEM_PROMPT;
  
  contextPrompt += `\n\n## ESTADO ACTUAL DE RECOPILACIÓN`;
  contextPrompt += `\n- Nombre: ${extractedInfo.name || "❌ NO recopilado"}`;
  contextPrompt += `\n- Email: ${extractedInfo.email || "❌ NO recopilado"}`;
  contextPrompt += `\n- Motivo: ${extractedInfo.reason || "❌ NO recopilado"}`;
  
  if (hasName && hasEmail && extractedInfo.reason) {
    contextPrompt += `\n\n✅ TIENES TODA LA INFORMACIÓN. Confirma los datos, agradece y despídete indicando que un agente contactará pronto.`;
  }

  // Usar Mistral AI
  if (process.env.MISTRAL_API_KEY) {
    try {
      const { text } = await generateText({
        model: mistral("mistral-small-latest"),
        system: contextPrompt,
        messages,
        maxTokens: 300,
        temperature: 0.7,
      });

      const needsHuman = text.includes("[NEEDS_HUMAN]");
      const cleanResponse = text.replace("[NEEDS_HUMAN]", "").trim();

      return {
        response: cleanResponse || "Gracias por tu mensaje. Un agente te contactará pronto.",
        needsHuman,
        extractedInfo: {
          name: extractedInfo.name || currentInfo.name,
          email: extractedInfo.email || currentInfo.email,
          reason: extractedInfo.reason || currentInfo.reason,
          phone: extractedInfo.phone || currentInfo.phone,
        },
      };
    } catch (error) {
      console.error("Mistral AI error:", error);
    }
  }

  // Fallback si no hay API key
  return {
    response: "Gracias por contactarnos. Tu mensaje ha sido registrado y un agente te contactará lo antes posible.",
    needsHuman: true,
    extractedInfo,
  };
}

// ============================================================================
// Helper: Verificar si la info está completa
// ============================================================================

export function isInfoComplete(info: CollectedInfo): boolean {
  return !!(info.name && info.email && info.reason);
}

// ============================================================================
// Legacy function para compatibilidad (deprecated)
// ============================================================================

/**
 * @deprecated Usar generateAIResponse en su lugar
 */
export async function generateAIResponseLegacy(
  messages: { role: "user" | "assistant"; content: string }[],
  userName: string,
  options?: { detectHumanNeed?: boolean; hasUserInfo?: boolean; userEmail?: string; userPhone?: string }
): Promise<string> {
  const result = await generateAIResponse(messages, {
    detectHumanNeed: options?.detectHumanNeed,
    collectedInfo: {
      name: userName,
      email: options?.userEmail,
      phone: options?.userPhone,
    },
  });

  return options?.detectHumanNeed && result.needsHuman
    ? `${result.response} [NEEDS_HUMAN]`
    : result.response;
}
