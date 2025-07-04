import { z } from 'zod';

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

export const UserRoleSchema = z.enum(['admin', 'technician', 'client']);
export const TicketStatusSchema = z.enum(['pending_approval', 'open', 'in_progress', 'resolved', 'closed']);
export const TicketPrioritySchema = z.enum(['low', 'medium', 'high']);
export const TicketSourceSchema = z.enum(['email', 'phone', 'web', 'in_person']);

// =============================================================================
// BASE ENTITY SCHEMAS (Database Row Types)
// =============================================================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: UserRoleSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  company_name: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ServiceTagSchema = z.object({
  id: z.string().regex(/^ST-\d{6}$/, 'Invalid service tag ID format'),
  tag: z.string().min(1),
  description: z.string().min(1),
  client_id: z.string().uuid(),
  hardware_type: z.string().min(1),
  location: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const TicketSchema = z.object({
  id: z.string().regex(/^TK-\d{6}$/, 'Invalid ticket ID format'),
  title: z.string().min(1),
  description: z.string().min(1),
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  reported_by: z.string().uuid(),
  assigned_to: z.string().uuid().nullable(),
  service_tag_id: z.string().regex(/^ST-\d{6}$/, 'Invalid service tag ID format'),
  source: TicketSourceSchema,
  photo_url: z.string().url().nullable(),
  time_open: z.string().datetime().nullable(),
  time_closed: z.string().datetime().nullable(),
  approved_by: z.string().uuid().nullable(),
  approved_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const TicketUpdateSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string().regex(/^TK-\d{6}$/, 'Invalid ticket ID format'),
  user_id: z.string().uuid(),
  message: z.string().min(1),
  created_at: z.string().datetime(),
});

// =============================================================================
// INPUT SCHEMAS (For Create Operations)
// =============================================================================

export const CreateUserInputSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(1, 'Name is required'),
  role: UserRoleSchema,
});

export const CreateClientInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  company_name: z.string().min(1, 'Company name is required'),
});

export const CreateServiceTagInputSchema = z.object({
  tag: z.string().min(1, 'Tag is required'),
  description: z.string().min(1, 'Description is required'),
  client_id: z.string().uuid('Invalid client ID'),
  hardware_type: z.string().min(1, 'Hardware type is required'),
  location: z.string().min(1, 'Location is required'),
});

export const CreateTicketInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: TicketPrioritySchema,
  service_tag_id: z.string().regex(/^ST-\d{6}$/, 'Invalid service tag ID format').or(z.string().uuid('Invalid service tag ID')),
  source: TicketSourceSchema,
  photo_url: z.string().url('Please enter a valid URL').optional(),
});

export const CreateTicketUpdateInputSchema = z.object({
  ticket_id: z.string().regex(/^TK-\d{6}$/, 'Invalid ticket ID format').or(z.string().uuid('Invalid ticket ID')),
  message: z.string().min(1, 'Message is required'),
});

// =============================================================================
// UPDATE SCHEMAS (For Update Operations)
// =============================================================================

export const UpdateUserInputSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Please enter a valid email address').optional(),
  name: z.string().min(1, 'Name cannot be empty').optional(),
  role: UserRoleSchema.optional(),
});

export const UpdateClientInputSchema = z.object({
  id: z.string().uuid('Invalid client ID'),
  name: z.string().min(1, 'Name cannot be empty').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(1, 'Phone cannot be empty').optional(),
  address: z.string().min(1, 'Address cannot be empty').optional(),
  company_name: z.string().min(1, 'Company name cannot be empty').optional(),
});

export const UpdateServiceTagInputSchema = z.object({
  id: z.string().regex(/^ST-\d{6}$/, 'Invalid service tag ID format').or(z.string().uuid('Invalid service tag ID')),
  tag: z.string().min(1, 'Tag cannot be empty').optional(),
  description: z.string().min(1, 'Description cannot be empty').optional(),
  client_id: z.string().uuid('Invalid client ID').optional(),
  hardware_type: z.string().min(1, 'Hardware type cannot be empty').optional(),
  location: z.string().min(1, 'Location cannot be empty').optional(),
});

export const UpdateTicketInputSchema = z.object({
  id: z.string().regex(/^TK-\d{6}$/, 'Invalid ticket ID format').or(z.string().uuid('Invalid ticket ID')),
  title: z.string().min(1, 'Title cannot be empty').optional(),
  description: z.string().min(1, 'Description cannot be empty').optional(),
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  assigned_to: z.string().uuid('Invalid user ID').nullable().optional(),
  service_tag_id: z.string().regex(/^ST-\d{6}$/, 'Invalid service tag ID format').or(z.string().uuid('Invalid service tag ID')).optional(),
  source: TicketSourceSchema.optional(),
  photo_url: z.string().url('Please enter a valid URL').nullable().optional(),
});

// =============================================================================
// QUERY SCHEMAS (For Query Parameters)
// =============================================================================

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

export const ClientIdParamSchema = z.object({
  clientId: z.string().uuid('Invalid client ID format'),
});

// =============================================================================
// RESPONSE SCHEMAS (For API Responses with Joins)
// =============================================================================

// User info for joins (minimal data)
export const UserInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

// Client info for joins (minimal data)  
export const ClientInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  company_name: z.string(),
});

// Service tag with client info
export const ServiceTagWithClientSchema = ServiceTagSchema.extend({
  clients: ClientInfoSchema,
});

// Ticket with all related data
export const TicketWithRelationsSchema = TicketSchema.extend({
  service_tags: ServiceTagWithClientSchema,
  reported_user: UserInfoSchema,
  assigned_user: UserInfoSchema.nullable(),
  approved_user: UserInfoSchema.nullable(),
});

// Ticket update with user info
export const TicketUpdateWithUserSchema = TicketUpdateSchema.extend({
  users: UserInfoSchema,
});

// Complete ticket with updates (for detailed view)
export const TicketDetailSchema = TicketWithRelationsSchema.extend({
  ticket_updates: z.array(TicketUpdateWithUserSchema),
});

// =============================================================================
// SUCCESS RESPONSE SCHEMAS
// =============================================================================

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

export const DeleteResponseSchema = SuccessResponseSchema;

// Test connection response
export const TestConnectionResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  data: z.array(z.any()).optional(),
  count: z.number().optional(),
});

// =============================================================================
// TYPE EXPORTS (Inferred from Schemas)
// =============================================================================

export type UserRole = z.infer<typeof UserRoleSchema>;
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type TicketSource = z.infer<typeof TicketSourceSchema>;

export type User = z.infer<typeof UserSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type ServiceTag = z.infer<typeof ServiceTagSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type TicketUpdate = z.infer<typeof TicketUpdateSchema>;

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type CreateClientInput = z.infer<typeof CreateClientInputSchema>;
export type CreateServiceTagInput = z.infer<typeof CreateServiceTagInputSchema>;
export type CreateTicketInput = z.infer<typeof CreateTicketInputSchema>;
export type CreateTicketUpdateInput = z.infer<typeof CreateTicketUpdateInputSchema>;

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientInputSchema>;
export type UpdateServiceTagInput = z.infer<typeof UpdateServiceTagInputSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketInputSchema>;

export type UserInfo = z.infer<typeof UserInfoSchema>;
export type ClientInfo = z.infer<typeof ClientInfoSchema>;
export type ServiceTagWithClient = z.infer<typeof ServiceTagWithClientSchema>;
export type TicketWithRelations = z.infer<typeof TicketWithRelationsSchema>;
export type TicketUpdateWithUser = z.infer<typeof TicketUpdateWithUserSchema>;
export type TicketDetail = z.infer<typeof TicketDetailSchema>;

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type TestConnectionResponse = z.infer<typeof TestConnectionResponseSchema>;

// New approval and assignment schemas
export const ApproveTicketInputSchema = z.object({
  ticket_id: z.string().regex(/^TK-\d{6}$/, 'Invalid ticket ID format'),
});

export const AssignUserInputSchema = z.object({
  ticket_id: z.string().regex(/^TK-\d{6}$/, 'Invalid ticket ID format').or(z.string().uuid('Invalid ticket ID')), // Support both formats during transition
  user_id: z.string().uuid('Invalid user ID').nullable(),
});

// Additional relation schemas
export const ClientWithCountSchema = ClientSchema.extend({
  service_tags_count: z.number(),
  tickets_count: z.number(),
});

export const TicketWithUpdatesSchema = TicketWithRelationsSchema.extend({
  ticket_updates: z.array(TicketUpdateWithUserSchema),
});

// Additional type exports for new schemas
export type ClientWithCount = z.infer<typeof ClientWithCountSchema>;
export type TicketWithUpdates = z.infer<typeof TicketWithUpdatesSchema>;
export type ApproveTicketInput = z.infer<typeof ApproveTicketInputSchema>;
export type AssignUserInput = z.infer<typeof AssignUserInputSchema>;

// Display mappings for Spanish UI (code stays in English, UI shows Spanish)
export const TICKET_STATUS_LABELS = {
  pending_approval: 'Pendiente de Aprobación',
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
} as const;

export const TICKET_PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
} as const;

export const TICKET_SOURCE_LABELS = {
  email: 'Email',
  phone: 'Teléfono',
  web: 'Web',
  in_person: 'En Persona',
} as const;

export const USER_ROLE_LABELS = {
  admin: 'Administrador',
  technician: 'Técnico',
  client: 'Cliente',
} as const;

// Helper schemas for validation
export const TicketIdSchema = z.string().regex(/^TK-\d{6}$/, 'Invalid ticket ID format');
export const ServiceTagIdSchema = z.string().regex(/^ST-\d{6}$/, 'Invalid service tag ID format'); 