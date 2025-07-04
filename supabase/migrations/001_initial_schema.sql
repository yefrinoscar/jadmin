-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for enums
CREATE TYPE user_role AS ENUM ('admin', 'technician', 'client');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE ticket_source AS ENUM ('email', 'phone', 'web', 'in_person');

-- Create users table (extends auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clients table
CREATE TABLE public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    company_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service_tags table
CREATE TABLE public.service_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tag TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    hardware_type TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    priority ticket_priority NOT NULL,
    reported_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    service_tag_id UUID REFERENCES public.service_tags(id) ON DELETE CASCADE NOT NULL,
    source ticket_source NOT NULL,
    photo_url TEXT,
    time_open TIMESTAMPTZ DEFAULT NOW(),
    time_closed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticket_updates table
CREATE TABLE public.ticket_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_service_tags_client_id ON public.service_tags(client_id);
CREATE INDEX idx_service_tags_tag ON public.service_tags(tag);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_reported_by ON public.tickets(reported_by);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_tickets_service_tag_id ON public.tickets(service_tag_id);
CREATE INDEX idx_ticket_updates_ticket_id ON public.ticket_updates(ticket_id);
CREATE INDEX idx_ticket_updates_user_id ON public.ticket_updates(user_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_tags_updated_at 
    BEFORE UPDATE ON public.service_tags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON public.tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins and technicians can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'technician')
        )
    );

-- Clients policies
CREATE POLICY "Admins and technicians can manage clients" ON public.clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'technician')
        )
    );

CREATE POLICY "Clients can view their own information" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND email = clients.email
        )
    );

-- Service tags policies
CREATE POLICY "Admins and technicians can manage service tags" ON public.service_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'technician')
        )
    );

CREATE POLICY "Clients can view their service tags" ON public.service_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.clients c ON u.email = c.email
            WHERE u.id = auth.uid() AND c.id = service_tags.client_id
        )
    );

-- Tickets policies
CREATE POLICY "Admins and technicians can manage all tickets" ON public.tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'technician')
        )
    );

CREATE POLICY "Users can view tickets they reported or are assigned to" ON public.tickets
    FOR SELECT USING (
        auth.uid() = reported_by OR auth.uid() = assigned_to
    );

CREATE POLICY "Users can create tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Clients can view their tickets" ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.clients c ON u.email = c.email
            JOIN public.service_tags st ON c.id = st.client_id
            WHERE u.id = auth.uid() AND st.id = tickets.service_tag_id
        )
    );

-- Ticket updates policies
CREATE POLICY "Admins and technicians can manage all ticket updates" ON public.ticket_updates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'technician')
        )
    );

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
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_id 
            AND (t.reported_by = auth.uid() OR t.assigned_to = auth.uid())
        )
    );

-- Function to automatically create user profile when signing up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically set time_closed when ticket status is changed to closed or resolved
CREATE OR REPLACE FUNCTION public.handle_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Set time_closed when status changes to closed or resolved
    IF NEW.status IN ('closed', 'resolved') AND OLD.status NOT IN ('closed', 'resolved') THEN
        NEW.time_closed = NOW();
    -- Clear time_closed if status changes back to open or in_progress
    ELSIF NEW.status IN ('open', 'in_progress') AND OLD.status IN ('closed', 'resolved') THEN
        NEW.time_closed = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket status changes
CREATE TRIGGER on_ticket_status_change
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.handle_ticket_status_change(); 