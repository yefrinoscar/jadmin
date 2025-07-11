export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          address: string;
          company_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          address: string;
          company_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          company_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'technician' | 'client';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'admin' | 'technician' | 'client';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'technician' | 'client';
          created_at?: string;
          updated_at?: string;
        };
      };
      service_tags: {
        Row: {
          id: string;
          tag: string;
          description: string;
          client_id: string;
          hardware_type: string;
          location: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tag: string;
          description: string;
          client_id: string;
          hardware_type: string;
          location: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tag?: string;
          description?: string;
          client_id?: string;
          hardware_type?: string;
          location?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: 'pending_approval' | 'open' | 'in_progress' | 'resolved' | 'closed';
          priority: 'low' | 'medium' | 'high';
          reported_by: string;
          assigned_to: string | null;
          client_id: string;
          source: 'email' | 'phone' | 'web' | 'in_person';
          photo_url: string | null;
          time_open: string | null;
          time_closed: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          status?: 'pending_approval' | 'open' | 'in_progress' | 'resolved' | 'closed';
          priority: 'low' | 'medium' | 'high';
          reported_by: string;
          assigned_to?: string | null;
          client_id: string;
          source: 'email' | 'phone' | 'web' | 'in_person';
          photo_url?: string | null;
          time_open?: string | null;
          time_closed?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          status?: 'pending_approval' | 'open' | 'in_progress' | 'resolved' | 'closed';
          priority?: 'low' | 'medium' | 'high';
          reported_by?: string;
          assigned_to?: string | null;
          client_id?: string;
          source?: 'email' | 'phone' | 'web' | 'in_person';
          photo_url?: string | null;
          time_open?: string | null;
          time_closed?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_service_tags: {
        Row: {
          id: string;
          ticket_id: string;
          service_tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          service_tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          service_tag_id?: string;
          created_at?: string;
        };
      };
      ticket_updates: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          user_id: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          user_id?: string;
          message?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      tickets_with_service_tags: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: 'pending_approval' | 'open' | 'in_progress' | 'resolved' | 'closed';
          priority: 'low' | 'medium' | 'high';
          reported_by: string;
          assigned_to: string | null;
          client_id: string;
          client_company_name: string;
          reported_user_name: string;
          reported_user_email: string;
          assigned_user_name: string | null;
          assigned_user_email: string | null;
          source: 'email' | 'phone' | 'web' | 'in_person';
          photo_url: string | null;
          time_open: string | null;
          time_closed: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
          service_tags: Json | null;
        };
      };
    };
    Functions: {
      add_service_tag_to_ticket: {
        Args: {
          p_ticket_id: string;
          p_service_tag_id: string;
        };
        Returns: string;
      };
      remove_service_tag_from_ticket: {
        Args: {
          p_ticket_id: string;
          p_service_tag_id: string;
        };
        Returns: boolean;
      };
      get_ticket_service_tags: {
        Args: {
          p_ticket_id: string;
        };
        Returns: {
          service_tag_id: string;
          tag: string;
          description: string;
          client_name: string;
          hardware_type: string;
          location: string;
        }[];
      };
      get_service_tags_for_client: {
        Args: {
          p_client_id: string;
        };
        Returns: {
          service_tag_id: string;
          tag: string;
          description: string;
          hardware_type: string;
          location: string;
        }[];
      };
      create_ticket_with_client_validation: {
        Args: {
          p_title: string;
          p_description: string;
          p_client_id: string;
          p_service_tag_ids: string[];
          p_priority?: string;
          p_source?: string;
          p_reported_by?: string;
        };
        Returns: string;
      };
      create_public_ticket: {
        Args: {
          p_title: string;
          p_description: string;
          p_company_name: string;
          p_service_tag_names: string[];
          p_contact_name: string;
          p_contact_email: string;
          p_contact_phone: string;
          p_priority?: string;
          p_source?: string;
          p_photo_url?: string;
        };
        Returns: Json;
      };
      get_pending_approval_tickets: {
        Args: Record<PropertyKey, never>;
        Returns: {
          ticket_id: string;
          title: string;
          description: string;
          company_name: string;
          contact_name: string;
          contact_email: string;
          contact_phone: string;
          service_tags: Json;
          created_at: string;
          client_was_new: boolean;
          is_public_submission: boolean;
        }[];
      };
      approve_public_ticket: {
        Args: {
          p_ticket_id: string;
          p_admin_user_id: string;
          p_approved: boolean;
          p_rejection_reason?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      user_role: 'admin' | 'technician' | 'client';
      ticket_status: 'pending_approval' | 'open' | 'in_progress' | 'resolved' | 'closed';
      ticket_priority: 'low' | 'medium' | 'high';
      ticket_source: 'email' | 'phone' | 'web' | 'in_person';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}; 