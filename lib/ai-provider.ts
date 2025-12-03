import { createMistral } from "@ai-sdk/mistral";
import { generateText } from "ai";

// Initialize Mistral provider
const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const SYSTEM_PROMPT = `Eres un asistente de soporte técnico amable y profesional para JAdmin, un sistema de gestión de tickets.
Tu rol es ayudar a los usuarios con sus consultas técnicas y problemas.

## RECOPILACIÓN DE INFORMACIÓN (PRIORIDAD MÁXIMA)

ANTES de ayudar con cualquier consulta, DEBES verificar que tienes la siguiente información del usuario:
1. Nombre completo
2. Email de contacto
3. Teléfono (opcional pero recomendado)

Si el usuario NO ha proporcionado nombre o email:
- En tu PRIMER mensaje, saluda amablemente y solicita esta información
- Ejemplo: "¡Hola! Antes de ayudarte, ¿podrías proporcionarme tu nombre y email para poder darte un mejor seguimiento?"
- NO respondas a consultas técnicas hasta tener al menos nombre y email
- Si solo dan el nombre, pide el email
- Si solo dan el email, pide el nombre

Si el usuario YA proporcionó nombre y email:
- Procede a ayudar con su consulta normalmente

## Directrices Generales:
- Responde siempre en español
- Sé conciso pero útil (máximo 2-3 párrafos)
- Si no sabes algo, sugiere contactar a un técnico humano
- Mantén un tono profesional pero cercano
- Ofrece soluciones paso a paso cuando sea apropiado
- Si el problema parece urgente o complejo, indica que un agente humano revisará el caso
- Puedes ayudar con: problemas de tickets, consultas sobre el sistema, problemas técnicos generales`;

interface AIResponseOptions {
  detectHumanNeed?: boolean;
  hasUserInfo?: boolean; // true si ya se recopiló nombre y email
  userEmail?: string;
  userPhone?: string;
}

export async function generateAIResponse(
  messages: { role: "user" | "assistant"; content: string }[], 
  userName: string,
  options?: AIResponseOptions
): Promise<string> {
  let systemPrompt = SYSTEM_PROMPT;
  
  // Si ya tenemos la información del usuario, indicarlo al modelo
  if (options?.hasUserInfo && userName) {
    systemPrompt += `\n\n## INFORMACIÓN DEL USUARIO (YA RECOPILADA)
- Nombre: ${userName}
- Email: ${options.userEmail || 'No proporcionado'}
- Teléfono: ${options.userPhone || 'No proporcionado'}

Ya tienes la información necesaria. Procede a ayudar con la consulta del usuario. Personaliza tus respuestas usando su nombre cuando sea apropiado.`;
  } else {
    systemPrompt += `\n\nEl usuario se llama ${userName || 'desconocido'}. Si no tienes su nombre o email, solicítalos amablemente antes de continuar.`;
  }
  
  if (options?.detectHumanNeed) {
    systemPrompt += `\n\nSi detectas frustración o urgencia, o si el caso necesita atención humana, añade exactamente al final: [NEEDS_HUMAN]`;
  }

  // Use Mistral AI (cheapest: $0.04/M input, $0.12/M output)
  if (process.env.MISTRAL_API_KEY) {
    try {
      const { text } = await generateText({
        model: mistral("mistral-small-latest"),
        system: systemPrompt,
        messages,
        maxOutputTokens: 500,
        temperature: 0.7,
      });

      return text || "Lo siento, no pude procesar tu mensaje.";
    } catch (error) {
      console.error("Mistral AI error:", error);
    }
  }

  // No AI provider configured
  const fallbackMessage = `¡Hola ${userName}! Gracias por contactarnos. Tu mensaje ha sido registrado y un agente te contactará lo antes posible.`;
  
  return options?.detectHumanNeed ? `${fallbackMessage} [NEEDS_HUMAN]` : fallbackMessage;
}
