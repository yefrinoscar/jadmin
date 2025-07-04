export interface Ticket {
  id: string
  title: string
  description: string
  status: "pending_approval" | "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high"
  reported_by: string
  assigned_to: string | null
  service_tag_id: string
  source: "email" | "phone" | "web" | "in_person"
  photo_url: string | null
  time_open: string | null
  time_closed: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
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