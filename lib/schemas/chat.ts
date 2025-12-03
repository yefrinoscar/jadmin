import { z } from 'zod';

// Enums
export const ChatConversationStatusEnum = z.enum(['active', 'closed', 'archived']);
export const ChatMessageSenderTypeEnum = z.enum(['visitor', 'ai', 'agent']);

// Conversation schemas
export const ChatConversationSchema = z.object({
  id: z.string().uuid(),
  visitor_name: z.string(),
  visitor_email: z.string().email(),
  visitor_phone: z.string().nullable(),
  visitor_company: z.string().nullable(),
  status: ChatConversationStatusEnum,
  needs_human_attention: z.boolean(),
  is_resolved: z.boolean(),
  message_count: z.number(),
  ai_message_count: z.number(),
  agent_message_count: z.number(),
  last_message_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  source_url: z.string().nullable(),
  assigned_to: z.string().nullable(), // User ID (can be Clerk ID or UUID)
  closed_at: z.string().nullable(),
});

export const ChatConversationListItemSchema = z.object({
  id: z.string().uuid(),
  visitor_name: z.string(),
  visitor_email: z.string(),
  visitor_phone: z.string().nullable(),
  visitor_company: z.string().nullable(),
  status: ChatConversationStatusEnum,
  needs_human_attention: z.boolean(),
  is_resolved: z.boolean(),
  message_count: z.number(),
  last_message_at: z.string(),
  created_at: z.string(),
  source_url: z.string().nullable(),
  assigned_to: z.string().nullable(), // User ID (can be Clerk ID or UUID)
  assigned_user: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
  last_message: z.string().nullable(),
});

export const ChatConversationsListSchema = z.array(ChatConversationListItemSchema);

// Message schemas
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  content: z.string(),
  sender_type: ChatMessageSenderTypeEnum,
  ai_model: z.string().nullable(),
  agent_id: z.string().nullable(), // User ID (can be Clerk ID or UUID)
  created_at: z.string(),
});

export const ChatMessagesListSchema = z.array(ChatMessageSchema);

// Input schemas
export const GetConversationsInputSchema = z.object({
  status: ChatConversationStatusEnum.optional(),
  needsHumanAttention: z.boolean().optional(),
});

export const GetMessagesInputSchema = z.object({
  conversationId: z.string().uuid(),
});

export const SendMessageInputSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1),
});

export const UpdateConversationInputSchema = z.object({
  id: z.string().uuid(),
  status: ChatConversationStatusEnum.optional(),
  needs_human_attention: z.boolean().optional(),
  is_resolved: z.boolean().optional(),
  assigned_to: z.string().nullable().optional(), // User ID (can be Clerk ID or UUID)
});

// Export types
export type ChatConversation = z.infer<typeof ChatConversationSchema>;
export type ChatConversationListItem = z.infer<typeof ChatConversationListItemSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatConversationStatus = z.infer<typeof ChatConversationStatusEnum>;
export type ChatMessageSenderType = z.infer<typeof ChatMessageSenderTypeEnum>;

// Status options for filters
export const chatConversationStatuses = [
  { value: 'active', label: 'Activo', icon: '🟢' },
  { value: 'closed', label: 'Cerrado', icon: '🔴' },
  { value: 'archived', label: 'Archivado', icon: '📦' },
];

export const chatMessageSenderTypes = [
  { value: 'visitor', label: 'Visitante' },
  { value: 'ai', label: 'IA' },
  { value: 'agent', label: 'Agente' },
];

