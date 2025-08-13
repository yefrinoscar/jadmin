import { z } from "zod";
import { UserSchema } from "../schemas";

// Enums
export const TicketPriorityEnum = z.enum(["low", "medium", "high"]);
export const TicketStatusEnum = z.enum([
  "pending_approval",
  "open",
  "in_progress",
  "resolved",
  "closed"
]);
export const TicketSourceEnum = z.enum(["email", "phone", "web", "in_person"]);

// Labels for UI display
export const TICKET_STATUS_LABELS: Record<z.infer<typeof TicketStatusEnum>, string> = {
  pending_approval: "Pendiente de Aprobación",
  open: "Abierto",
  in_progress: "En Progreso",
  resolved: "Resuelto",
  closed: "Cerrado",
};

export const TICKET_PRIORITY_LABELS: Record<z.infer<typeof TicketPriorityEnum>, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

export const TICKET_SOURCE_LABELS: Record<z.infer<typeof TicketSourceEnum>, string> = {
  email: "Email",
  phone: "Teléfono",
  web: "Web",
  in_person: "En Persona",
};

// Service Tag Schema
export const ServiceTagSchema = z.object({
  id: z.string(),
  tag: z.string(),
  description: z.string(),
  client_id: z.string().uuid(),
});

// Base Ticket Schema
export const BaseTicketSchema = z.object({
  id: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: TicketStatusEnum,
  priority: TicketPriorityEnum,
  reported_by: z.string().uuid(),
  assigned_to: z.string().uuid().nullable(),
  client_id: z.string().uuid(),
  source: TicketSourceEnum,
  photo_url: z.string().url().nullable(),
  time_open: z.string().datetime().nullable(),
  time_closed: z.string().datetime().nullable(),
  approved_by: z.string().uuid().nullable(),
  approved_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Extended Ticket Schema with Relations
export const TicketSchema = BaseTicketSchema.extend({
  client_company_name: z.string().optional(),
  service_tags: z.array(ServiceTagSchema),
  reported_user: UserSchema,
  assigned_user: UserSchema.nullable(),
  approved_user: UserSchema.nullable(),
});

// Ticket with all related data
export const TicketWithRelationsSchema = TicketSchema.extend({
  client_company_name: z.string(),
  ticket_service_tags: z.array(ServiceTagSchema),
  reported_user: UserSchema,
  assigned_user: UserSchema.nullable(),
  approved_user: UserSchema.nullable(),
});

// Schema for Creating a New Ticket
export const CreateTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: TicketPriorityEnum,
  client_id: z.string().uuid("Invalid client ID"),
  service_tag_ids: z.array(z.string().regex(/^ST-\d{6}$/, "Invalid service tag ID format").or(z.string().uuid("Invalid service tag ID"))).min(1, "At least one service tag is required"),
  source: TicketSourceEnum,
  photo_url: z.string().url("Please enter a valid URL").optional(),
});

// Schema for Updating a Ticket
export const UpdateTicketSchema = z.object({
  id: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format"),
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().min(1, "Description cannot be empty").optional(),
  status: TicketStatusEnum.optional(),
  priority: TicketPriorityEnum.optional(),
  assigned_to: z.string().nullable().optional(), 
  client_id: z.string().uuid("Invalid client ID").optional(),
  source: TicketSourceEnum.optional(),
  photo_url: z.string().url("Please enter a valid URL").nullable().optional(),
});

// Schema for Ticket Updates/Comments
export const TicketUpdateSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format"),
  user_id: z.string().uuid(),
  message: z.string().min(1),
  created_at: z.string().datetime(),
  user: UserSchema,
});

// Schema for Complete Ticket Details
export const TicketDetailSchema = TicketWithRelationsSchema.extend({
  ticket_updates: z.array(TicketUpdateSchema),
});

// Type Exports
export type Ticket = z.infer<typeof TicketSchema>;
export type BaseTicket = z.infer<typeof BaseTicketSchema>;
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;
export type TicketUpdate = z.infer<typeof TicketUpdateSchema>;
export type TicketDetail = z.infer<typeof TicketDetailSchema>;
export type ServiceTag = z.infer<typeof ServiceTagSchema>;
export type User = z.infer<typeof UserSchema>;
export type TicketPriority = z.infer<typeof TicketPriorityEnum>;
export type TicketStatus = z.infer<typeof TicketStatusEnum>;
export type TicketSource = z.infer<typeof TicketSourceEnum>;
export type TicketWithRelations = z.infer<typeof TicketWithRelationsSchema>;

// Options for UI components
export const ticketStatuses = [
  {
    value: "pending_approval",
    label: TICKET_STATUS_LABELS.pending_approval,
  },
  {
    value: "open",
    label: TICKET_STATUS_LABELS.open,
  },
  {
    value: "in_progress",
    label: TICKET_STATUS_LABELS.in_progress,
  },
  {
    value: "resolved",
    label: TICKET_STATUS_LABELS.resolved,
  },
  {
    value: "closed",
    label: TICKET_STATUS_LABELS.closed,
  },
]

export const ticketPriorities = [
  {
    value: "low",
    label: TICKET_PRIORITY_LABELS.low,
  },
  {
    value: "medium",
    label: TICKET_PRIORITY_LABELS.medium,
  },
  {
    value: "high",
    label: TICKET_PRIORITY_LABELS.high,
  },
]

export const ticketSources = [
  {
    value: "email",
    label: "Email",
  },
  {
    value: "phone",
    label: "Phone",
  },
  {
    value: "web",
    label: "Web",
  },
  {
    value: "in_person",
    label: "In Person",
  },
] 