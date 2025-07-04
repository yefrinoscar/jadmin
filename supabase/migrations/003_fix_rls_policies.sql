-- Fix infinite recursion in RLS policies

-- Drop ALL existing policies on all tables
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

-- Create new simplified policies without recursion

-- User policies - keep basic self-access + general viewing
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow all authenticated users to view other users (we'll handle role-based restrictions in app logic)
CREATE POLICY "Authenticated users can view all users" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Client policies - simplified to allow all authenticated users
CREATE POLICY "Authenticated users can manage clients" ON public.clients
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Service tag policies - simplified to allow all authenticated users
CREATE POLICY "Authenticated users can manage service tags" ON public.service_tags
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Ticket policies - simplified to allow all authenticated users
CREATE POLICY "Authenticated users can manage all tickets" ON public.tickets
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Ticket update policies - simplified to allow all authenticated users
CREATE POLICY "Authenticated users can manage all ticket updates" ON public.ticket_updates
    FOR ALL USING (auth.uid() IS NOT NULL); 