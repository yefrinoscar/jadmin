-- STANDALONE SCRIPT TO FIX RLS POLICIES
-- Copy and paste this entire script into Supabase Dashboard → SQL Editor → Run

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_select_all_authenticated" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins and technicians can view all users" ON public.users;

DROP POLICY IF EXISTS "clients_all_authenticated" ON public.clients;
DROP POLICY IF EXISTS "Admins and technicians can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view their own information" ON public.clients;

DROP POLICY IF EXISTS "service_tags_all_authenticated" ON public.service_tags;
DROP POLICY IF EXISTS "Admins and technicians can manage service tags" ON public.service_tags;
DROP POLICY IF EXISTS "Clients can view their service tags" ON public.service_tags;

DROP POLICY IF EXISTS "tickets_all_authenticated" ON public.tickets;
DROP POLICY IF EXISTS "Admins and technicians can manage all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view tickets they reported or are assigned to" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;

DROP POLICY IF EXISTS "ticket_updates_all_authenticated" ON public.ticket_updates;
DROP POLICY IF EXISTS "Admins and technicians can manage all ticket updates" ON public.ticket_updates;
DROP POLICY IF EXISTS "Users can view updates for tickets they have access to" ON public.ticket_updates;
DROP POLICY IF EXISTS "Users can create updates for tickets they have access to" ON public.ticket_updates;

DROP POLICY IF EXISTS "Admins and technicians can manage ticket service tags" ON public.ticket_service_tags;
DROP POLICY IF EXISTS "Users can view their ticket service tags" ON public.ticket_service_tags;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_service_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing helper functions to avoid conflicts
DROP FUNCTION IF EXISTS public.is_admin_or_technician();
DROP FUNCTION IF EXISTS public.is_client();
DROP FUNCTION IF EXISTS public.get_user_role();

-- Create function to get user role directly from auth.users metadata
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Get role from auth.users metadata
  RETURN (
    SELECT raw_user_meta_data->>'role'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin or technician
CREATE OR REPLACE FUNCTION public.is_admin_or_technician()
RETURNS boolean AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := public.get_user_role();
  RETURN user_role IN ('admin', 'technician');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is client
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := public.get_user_role();
  RETURN user_role = 'client';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins and technicians can view all users" ON public.users
  FOR SELECT USING (public.is_admin_or_technician());

-- Clients table policies
CREATE POLICY "Admins and technicians can manage clients" ON public.clients
  FOR ALL USING (public.is_admin_or_technician());

CREATE POLICY "Clients can view their own information" ON public.clients
  FOR SELECT USING (
    public.is_client() AND EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.client_id = clients.id 
      AND (t.reported_by = auth.uid() OR t.assigned_to = auth.uid())
    )
  );

-- Service tags table policies
CREATE POLICY "Admins and technicians can manage service tags" ON public.service_tags
  FOR ALL USING (public.is_admin_or_technician());

CREATE POLICY "Clients can view their service tags" ON public.service_tags
  FOR SELECT USING (
    public.is_client() AND EXISTS (
      SELECT 1 FROM public.tickets t 
      JOIN public.ticket_service_tags tst ON t.id = tst.ticket_id 
      WHERE tst.service_tag_id = service_tags.id 
      AND (t.reported_by = auth.uid() OR t.assigned_to = auth.uid())
    )
  );

-- Tickets table policies
CREATE POLICY "Admins and technicians can manage all tickets" ON public.tickets
  FOR ALL USING (public.is_admin_or_technician());

CREATE POLICY "Users can view tickets they reported or are assigned to" ON public.tickets
  FOR SELECT USING (
    reported_by = auth.uid() OR assigned_to = auth.uid()
  );

CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Ticket service tags junction table policies
CREATE POLICY "Admins and technicians can manage ticket service tags" ON public.ticket_service_tags
  FOR ALL USING (public.is_admin_or_technician());

CREATE POLICY "Users can view their ticket service tags" ON public.ticket_service_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_service_tags.ticket_id 
      AND (t.reported_by = auth.uid() OR t.assigned_to = auth.uid())
    )
  );

-- Ticket updates table policies
CREATE POLICY "Admins and technicians can manage all ticket updates" ON public.ticket_updates
  FOR ALL USING (public.is_admin_or_technician());

CREATE POLICY "Users can view updates for tickets they have access to" ON public.ticket_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_updates.ticket_id 
      AND (t.reported_by = auth.uid() OR t.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can create updates for tickets they have access to" ON public.ticket_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id 
      AND (t.reported_by = auth.uid() OR t.assigned_to = auth.uid())
    )
  );

-- Success message
SELECT 'RLS policies have been successfully updated!' as message; 