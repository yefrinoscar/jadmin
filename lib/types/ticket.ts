import { z } from "zod";

// Enums
export const TicketPriorityEnum = z.enum(["low", "medium", "high"]);
export const TicketSourceEnum = z.enum(["email", "phone", "web", "in_person", "integration"]);
export const TicketStatusEnum = z.enum([
  "pending_approval",
  "rejected",
  "open",
  "in_progress",
  "resolved",
  "closed"
]);

// Schema para imágenes base64
export const Base64ImageSchema = z.object({
  filename: z.string(),
  data: z.string().regex(/^data:image\/(jpeg|png|gif|webp);base64,/, "Debe ser una imagen base64 válida")
});

// Schema para crear un ticket público
export const CreatePublicTicketSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(255, "El título es muy largo"),
  description: z.string().min(1, "La descripción es requerida").max(2000, "La descripción es muy larga"),
  company_name: z.string().min(1, "El nombre de la empresa es requerido").max(255, "El nombre de la empresa es muy largo"),
  service_tag_names: z.array(z.string()).min(1, "Al menos una etiqueta de servicio es requerida"),
  contact_name: z.string().min(1, "El nombre del contacto es requerido"),
  contact_email: z.string().email("Email inválido"),
  contact_phone: z.string().min(1, "El teléfono es requerido"),
  priority: TicketPriorityEnum.default("medium"),
  source: TicketSourceEnum.default("web"),
  photo_url: z.string().url().optional(),
  images: z.array(Base64ImageSchema).optional() // Campo opcional para imágenes base64
});

export type CreatePublicTicketInput = z.infer<typeof CreatePublicTicketSchema>;

// Schema de respuesta
export const TicketResponseSchema = z.object({
  success: z.boolean(),
  ticket_id: z.string().optional(),
  company_name: z.string().optional(),
  using_provisional_company: z.boolean().optional(),
  created_service_tags: z.array(z.any()).optional(),
  existing_service_tags: z.array(z.any()).optional(),
  message: z.string(),
  error: z.string().optional(),
});

export type TicketResponse = z.infer<typeof TicketResponseSchema>;

export interface ServiceTag {
  id: string
  tag: string
  description: string
  hardware_type: string
  location: string
  client_name: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: "pending_approval" | "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high"
  reported_by: string
  assigned_to: string | null
  client_id: string
  client_company_name?: string // From the view
  service_tags?: ServiceTag[] // Array of service tags from the same company
  source: "email" | "phone" | "web" | "in_person"
  photo_url: string | null
  time_open: string | null
  time_closed: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  // User objects from JOINs
  reported_user?: User
  assigned_user?: User | null
}

// For working with the junction table
export interface TicketServiceTag {
  id: string
  ticket_id: string
  service_tag_id: string
  created_at: string
}

export const ticketStatuses = [
  {
    value: "pending_approval",
    label: "Pendiente de Aprobación",
  },
  {
    value: "open",
    label: "Abierto",
  },
  {
    value: "in_progress",
    label: "En Progreso", 
  },
  {
    value: "resolved",
    label: "Resuelto",
  },
  {
    value: "closed",
    label: "Cerrado",
  },
]

export const ticketPriorities = [
  {
    value: "low",
    label: "Baja",
  },
  {
    value: "medium", 
    label: "Media",
  },
  {
    value: "high",
    label: "Alta",
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