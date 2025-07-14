import { z } from "zod";

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
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  source: z.enum(["email", "phone", "web", "in_person", "integration"]).default("web"),
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

// For working with the junction table
export interface TicketServiceTag {
  id: string
  ticket_id: string
  service_tag_id: string
  created_at: string
} 