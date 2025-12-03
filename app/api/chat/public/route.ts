import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateAIResponse, isInfoComplete } from "@/lib/ai-provider";
import type { CollectedInfo } from "@/lib/schemas/chat";

// ============================================================================
// CORS Headers para acceso público (widget embebido)
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export const maxDuration = 30;

// ============================================================================
// Tipos internos
// ============================================================================

interface ConversationRecord {
  id: string;
  managed_by: "ai" | "human";
  collected_info: CollectedInfo | null;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string | null;
}

interface MessageRecord {
  content: string;
  sender_type: "visitor" | "ai" | "agent";
}

// ============================================================================
// POST - Enviar mensaje y obtener respuesta (endpoint público)
// ============================================================================

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await request.json();
    const {
      conversationId,
      message,
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorCompany,
      sourceUrl,
    } = body;

    // Validación básica
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    let currentConversationId = conversationId;
    let conversation: ConversationRecord | null = null;

    // ========================================================================
    // PASO 1: Obtener o crear conversación
    // ========================================================================

    if (!currentConversationId) {
      // Crear nueva conversación (inicia en modo IA)
      const { data: newConversation, error: createError } = await supabase
        .from("chat_conversations")
        .insert({
          visitor_name: visitorName || "Usuario",
          visitor_email: visitorEmail || "",
          visitor_phone: visitorPhone || null,
          visitor_company: visitorCompany || null,
          source_url: sourceUrl || null,
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          user_agent: request.headers.get("user-agent"),
          managed_by: "ai", // Siempre inicia en modo IA
          collected_info: {},
        })
        .select("id, managed_by, collected_info, visitor_name, visitor_email, visitor_phone")
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        return NextResponse.json(
          { error: "Failed to create conversation", details: createError.message },
          { status: 500, headers: corsHeaders }
        );
      }

      currentConversationId = newConversation.id;
      conversation = newConversation as ConversationRecord;
    } else {
      // Obtener conversación existente
      const { data: existingConversation, error: fetchError } = await supabase
        .from("chat_conversations")
        .select("id, managed_by, collected_info, visitor_name, visitor_email, visitor_phone")
        .eq("id", currentConversationId)
        .single();

      if (fetchError || !existingConversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      conversation = existingConversation as ConversationRecord;
    }

    // ========================================================================
    // PASO 2: Guardar mensaje del visitante
    // ========================================================================

    const { error: insertError } = await supabase.from("chat_messages").insert({
      conversation_id: currentConversationId,
      content: message.trim(),
      sender_type: "visitor",
    });

    if (insertError) {
      console.error("Error inserting message:", insertError);
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500, headers: corsHeaders }
      );
    }

    // ========================================================================
    // PASO 3: Evaluar si responde la IA o no (HANDOFF LOGIC)
    // ========================================================================

    // 🔴 SI managed_by === 'human' -> NO responde la IA
    if (conversation.managed_by === "human") {
      return NextResponse.json(
        {
          conversationId: currentConversationId,
          message: null, // Sin respuesta de IA
          managedBy: "human",
          awaitingHumanResponse: true,
        },
        { headers: corsHeaders }
      );
    }

    // ========================================================================
    // PASO 4: La IA responde (modo 'ai')
    // ========================================================================

    // Obtener historial para contexto
    const { data: history } = await supabase
      .from("chat_messages")
      .select("content, sender_type")
      .eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: true })
      .limit(15);

    // Convertir a formato para la IA
    const aiMessages = ((history as MessageRecord[]) || []).map((msg) => ({
      role: msg.sender_type === "visitor" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));

    // Información ya recopilada
    const currentCollectedInfo: CollectedInfo = {
      ...(conversation.collected_info || {}),
      name: conversation.visitor_name !== "Usuario" ? conversation.visitor_name : undefined,
      email: conversation.visitor_email || undefined,
      phone: conversation.visitor_phone || undefined,
    };

    // Generar respuesta de IA
    const aiResult = await generateAIResponse(aiMessages, {
      detectHumanNeed: true,
      collectedInfo: currentCollectedInfo,
    });

    // ========================================================================
    // PASO 5: Guardar respuesta de IA
    // ========================================================================

    await supabase.from("chat_messages").insert({
      conversation_id: currentConversationId,
      content: aiResult.response,
      sender_type: "ai",
      ai_model: "mistral-small",
    });

    // ========================================================================
    // PASO 6: Actualizar conversación con info recopilada
    // ========================================================================

    const updateData: Record<string, unknown> = {
      collected_info: aiResult.extractedInfo,
      last_message_at: new Date().toISOString(),
    };

    // Actualizar campos del visitante si se extrajeron nuevos datos
    if (aiResult.extractedInfo.name && conversation.visitor_name === "Usuario") {
      updateData.visitor_name = aiResult.extractedInfo.name;
    }
    if (aiResult.extractedInfo.email && !conversation.visitor_email) {
      updateData.visitor_email = aiResult.extractedInfo.email;
    }
    if (aiResult.extractedInfo.phone && !conversation.visitor_phone) {
      updateData.visitor_phone = aiResult.extractedInfo.phone;
    }

    // Marcar para atención humana si:
    // 1. La IA detectó frustración/urgencia
    // 2. Ya se recopiló toda la información necesaria
    if (aiResult.needsHuman || isInfoComplete(aiResult.extractedInfo)) {
      updateData.needs_human_attention = true;
    }

    await supabase
      .from("chat_conversations")
      .update(updateData)
      .eq("id", currentConversationId);

    // ========================================================================
    // PASO 7: Responder al cliente
    // ========================================================================

    return NextResponse.json(
      {
        conversationId: currentConversationId,
        message: aiResult.response,
        managedBy: "ai",
        needsHuman: aiResult.needsHuman,
        collectedInfo: aiResult.extractedInfo,
        infoComplete: isInfoComplete(aiResult.extractedInfo),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Public chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ============================================================================
// GET - Obtener configuración o historial (endpoint público)
// ============================================================================

export async function GET(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const config = searchParams.get("config");

    // Retornar configuración de Supabase para realtime en el widget
    if (config === "supabase") {
      return NextResponse.json(
        {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        { headers: corsHeaders }
      );
    }

    // Obtener historial de una conversación
    if (conversationId) {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("id, content, sender_type, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch messages" },
          { status: 500, headers: corsHeaders }
        );
      }

      // También obtener estado de la conversación
      const { data: conversation } = await supabase
        .from("chat_conversations")
        .select("managed_by, collected_info, status")
        .eq("id", conversationId)
        .single();

      return NextResponse.json(
        {
          messages,
          managedBy: conversation?.managed_by || "ai",
          collectedInfo: conversation?.collected_info || {},
          status: conversation?.status || "active",
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: "conversationId or config parameter is required" },
      { status: 400, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Get chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
