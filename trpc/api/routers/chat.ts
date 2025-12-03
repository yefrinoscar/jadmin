import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../init';
import { z } from 'zod';
import {
  ChatConversationListItemSchema,
  ChatConversationsListSchema,
  ChatMessageSchema,
  ChatMessagesListSchema,
  GetConversationsInputSchema,
  GetMessagesInputSchema,
  SendMessageInputSchema,
  UpdateConversationInputSchema,
} from '@/lib/schemas/chat';
import { SuccessResponseSchema } from '@/lib/schemas';

export const chatRouter = createTRPCRouter({
  // Get all conversations
  getConversations: protectedProcedure
    .input(GetConversationsInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes permiso para ver las conversaciones.',
        });
      }

      let query = ctx.supabase
        .from('chat_conversations')
        .select(`
          id,
          visitor_name,
          visitor_email,
          visitor_phone,
          visitor_company,
          status,
          needs_human_attention,
          is_resolved,
          message_count,
          last_message_at,
          created_at,
          source_url,
          assigned_to,
          assigned:users!assigned_to (
            id,
            name
          )
        `)
        .order('last_message_at', { ascending: false });

      if (input?.status) {
        query = query.eq('status', input.status);
      }

      if (input?.needsHumanAttention !== undefined) {
        query = query.eq('needs_human_attention', input.needsHumanAttention);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Error al obtener conversaciones: ${error.message}`,
          cause: error,
        });
      }

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMsg } = await ctx.supabase
            .from('chat_messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            assigned_user: conv.assigned ? {
              id: conv.assigned.id,
              name: conv.assigned.name,
            } : null,
            last_message: lastMsg?.content?.substring(0, 100) || null,
          };
        })
      );

      return ChatConversationsListSchema.parse(conversationsWithLastMessage);
    }),

  // Get messages for a conversation
  getMessages: protectedProcedure
    .input(GetMessagesInputSchema)
    .query(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes permiso para ver los mensajes.',
        });
      }

      const { data, error } = await ctx.supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', input.conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Error al obtener mensajes: ${error.message}`,
          cause: error,
        });
      }

      return ChatMessagesListSchema.parse(data || []);
    }),

  // Send a message as agent
  sendMessage: protectedProcedure
    .input(SendMessageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes permiso para enviar mensajes.',
        });
      }

      // Get user info from database - users.id is the same as auth.users.id
      const { data: userData } = await ctx.supabase
        .from('users')
        .select('id')
        .eq('id', ctx.auth.userId)
        .single();

      // Insert the message
      const { data: message, error: msgError } = await ctx.supabase
        .from('chat_messages')
        .insert({
          conversation_id: input.conversationId,
          content: input.content,
          sender_type: 'agent',
          agent_id: userData?.id || null,
        })
        .select()
        .single();

      if (msgError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Error al enviar mensaje: ${msgError.message}`,
          cause: msgError,
        });
      }

      // Update conversation - mark as handled by human
      await ctx.supabase
        .from('chat_conversations')
        .update({
          needs_human_attention: false,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', input.conversationId);

      return ChatMessageSchema.parse(message);
    }),

  // Update conversation status
  updateConversation: protectedProcedure
    .input(UpdateConversationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes permiso para actualizar conversaciones.',
        });
      }

      const { id, ...updateData } = input;

      // If marking as resolved or closed, set closed_at
      const finalUpdateData: Record<string, unknown> = { ...updateData };
      if (updateData.is_resolved || updateData.status === 'closed') {
        finalUpdateData.closed_at = new Date().toISOString();
      }

      const { error } = await ctx.supabase
        .from('chat_conversations')
        .update(finalUpdateData)
        .eq('id', id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Error al actualizar conversación: ${error.message}`,
          cause: error,
        });
      }

      return SuccessResponseSchema.parse({ success: true });
    }),

  // Get conversation by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes permiso para ver esta conversación.',
        });
      }

      const { data, error } = await ctx.supabase
        .from('chat_conversations')
        .select(`
          *,
          assigned:users!assigned_to (
            id,
            name
          )
        `)
        .eq('id', input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversación no encontrada.',
        });
      }

      return {
        ...data,
        assigned_user: data.assigned ? {
          id: data.assigned.id,
          name: data.assigned.name,
        } : null,
      };
    }),
});

