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