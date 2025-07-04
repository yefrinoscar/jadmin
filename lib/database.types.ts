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
          service_tag_id: string;
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
          service_tag_id: string;
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
          service_tag_id?: string;
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
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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