-- STANDALONE SCRIPT TO FIX RLS POLICIES
-- Copy and paste this entire script into Supabase Dashboard → SQL Editor → Run

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins and technicians can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;

DROP POLICY IF EXISTS "Admins and technicians can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view their own information" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.clients;

DROP POLICY IF EXISTS "Admins and technicians can manage service tags" ON public.service_tags;
DROP POLICY IF EXISTS "Clients can view their service tags" ON public.service_tags;
DROP POLICY IF EXISTS "Authenticated users can manage service tags" ON public.service_tags;

DROP POLICY IF EXISTS "Admins and technicians can manage all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view tickets they reported or are assigned to" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Clients can view their tickets" ON public.tickets;
DROP POLICY IF EXISTS "Authenticated users can manage all tickets" ON public.tickets;

DROP POLICY IF EXISTS "Admins and technicians can manage all ticket updates" ON public.ticket_updates;
DROP POLICY IF EXISTS "Users can view updates for tickets they have access to" ON public.ticket_updates;
DROP POLICY IF EXISTS "Users can create updates for tickets they have access to" ON public.ticket_updates;
DROP POLICY IF EXISTS "Authenticated users can manage all ticket updates" ON public.ticket_updates;

-- Create new simplified policies (no recursion)

-- Users table
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_select_all_authenticated" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Clients table
CREATE POLICY "clients_all_authenticated" ON public.clients
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Service tags table
CREATE POLICY "service_tags_all_authenticated" ON public.service_tags
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Tickets table
CREATE POLICY "tickets_all_authenticated" ON public.tickets
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Ticket updates table
CREATE POLICY "ticket_updates_all_authenticated" ON public.ticket_updates
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Success message
SELECT 'RLS policies have been successfully updated!' as message; 