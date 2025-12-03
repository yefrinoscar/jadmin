import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateAIResponse } from "@/lib/ai-provider";

// Headers CORS para acceso público
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export const maxDuration = 30;

// POST - Send a message and get AI response (public endpoint)
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
      sourceUrl 
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    let currentConversationId = conversationId;

    // If no conversation exists, create one (sin requerir nombre/email)
    if (!currentConversationId) {
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
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        return NextResponse.json(
          { error: "Failed to create conversation", details: createError.message },
          { status: 500, headers: corsHeaders }
        );
      }

      currentConversationId = newConversation.id;
    } else {
      // Si ya existe la conversación y recibimos información nueva, actualizarla
      if (visitorName || visitorEmail || visitorPhone) {
        const updateData: Record<string, string | null> = {};
        if (visitorName) updateData.visitor_name = visitorName;
        if (visitorEmail) updateData.visitor_email = visitorEmail;
        if (visitorPhone !== undefined) updateData.visitor_phone = visitorPhone || null;
        
        await supabase
          .from("chat_conversations")
          .update(updateData)
          .eq("id", currentConversationId);
      }
    }

    // Save visitor message
    await supabase
      .from("chat_messages")
      .insert({
        conversation_id: currentConversationId,
        content: message,
        sender_type: "visitor",
      });

    // Get conversation history for context
    const { data: history } = await supabase
      .from("chat_messages")
      .select("content, sender_type")
      .eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    const aiMessages = (history || []).map(msg => ({
      role: msg.sender_type === "visitor" ? "user" as const : "assistant" as const,
      content: msg.content,
    }));

    // Get visitor info from conversation
    const { data: conversation } = await supabase
      .from("chat_conversations")
      .select("visitor_name, visitor_email, visitor_phone")
      .eq("id", currentConversationId)
      .single();

    const visitorDisplayName = conversation?.visitor_name || visitorName || "";
    const hasUserInfo = !!(conversation?.visitor_name && conversation?.visitor_email);

    // Generate AI response with user info context
    const aiResponse = await generateAIResponse(aiMessages, visitorDisplayName, { 
      detectHumanNeed: true,
      hasUserInfo,
      userEmail: conversation?.visitor_email,
      userPhone: conversation?.visitor_phone,
    });

    // Check if needs human attention
    const needsHuman = aiResponse.includes("[NEEDS_HUMAN]");
    const cleanResponse = aiResponse.replace("[NEEDS_HUMAN]", "").trim();

    // Save AI response
    await supabase
      .from("chat_messages")
      .insert({
        conversation_id: currentConversationId,
        content: cleanResponse,
        sender_type: "ai",
        ai_model: "mistral-small",
      });

    // Update conversation if needs human attention
    if (needsHuman) {
      await supabase
        .from("chat_conversations")
        .update({ needs_human_attention: true })
        .eq("id", currentConversationId);
    }

    return NextResponse.json({
      conversationId: currentConversationId,
      message: cleanResponse,
      needsHuman,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Public chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET - Get conversation history (public endpoint)
export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const email = searchParams.get("email");

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

      return NextResponse.json({ messages }, { headers: corsHeaders });
    }

    if (email) {
      const { data: conversations, error } = await supabase
        .from("chat_conversations")
        .select("id, subject, status, last_message_at, created_at")
        .eq("visitor_email", email)
        .eq("status", "active")
        .order("last_message_at", { ascending: false })
        .limit(5);

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch conversations" },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json({ conversations }, { headers: corsHeaders });
    }

    return NextResponse.json(
      { error: "conversationId or email is required" },
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
