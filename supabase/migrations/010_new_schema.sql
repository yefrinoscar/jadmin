-- Migration: New Schema with Enhanced Ticket Management
-- Date: 2024
-- Description: Complete schema rebuild with enhanced ticket management features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'technician', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('pending_approval', 'rejected', 'open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_source AS ENUM ('email', 'phone', 'web', 'in_person', 'integration');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sequence for ticket IDs
CREATE SEQUENCE IF NOT EXISTS ticket_id_seq START 1;

-- Function to generate ticket IDs
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TK-' || LPAD(NEXTVAL('ticket_id_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate service tag IDs
CREATE OR REPLACE FUNCTION generate_service_tag_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ST-' || uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    company_name TEXT NOT NULL,
    is_provisional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create provisional/unknown client
INSERT INTO public.clients (
    name,
    email,
    phone,
    address,
    company_name,
    is_provisional
) VALUES (
    'Unknown Company',
    'unknown@provisional.local',
    'N/A',
    'Pending verification',
    'Unknown Company',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Create service_tags table
CREATE TABLE IF NOT EXISTS public.service_tags (
    id TEXT PRIMARY KEY DEFAULT generate_service_tag_id(),
    tag TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    hardware_type TEXT NOT NULL,
    location TEXT NOT NULL,
    is_auto_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id TEXT PRIMARY KEY DEFAULT generate_ticket_id(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'pending_approval',
    priority ticket_priority NOT NULL,
    reported_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    source ticket_source NOT NULL,
    photo_url TEXT[] DEFAULT NULL,
    time_open TIMESTAMPTZ,
    time_closed TIMESTAMPTZ,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    needs_company_review BOOLEAN DEFAULT FALSE,
    original_title TEXT,
    original_description TEXT,
    original_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticket_service_tags junction table
CREATE TABLE IF NOT EXISTS public.ticket_service_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id TEXT REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    service_tag_id TEXT REFERENCES public.service_tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticket_id, service_tag_id)
);

-- Create ticket_updates table
CREATE TABLE IF NOT EXISTS public.ticket_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id TEXT REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to handle public ticket submission with auto-creation of service tags
CREATE OR REPLACE FUNCTION create_public_ticket(
    p_title TEXT,
    p_description TEXT,
    p_company_name TEXT,
    p_service_tag_names TEXT[],
    p_contact_name TEXT,
    p_contact_email TEXT,
    p_contact_phone TEXT,
    p_priority TEXT DEFAULT 'medium',
    p_source TEXT DEFAULT 'web',
    p_photo_url TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_client_record RECORD;
    v_provisional_client_id UUID;
    v_new_ticket_id TEXT;
    v_service_tag_record RECORD;
    v_service_tag_name TEXT;
    v_created_tags JSON[] := '{}';
    v_existing_tags JSON[] := '{}';
    v_result JSON;
    v_needs_company_review BOOLEAN;
BEGIN
    -- Validate priority and source
    IF p_priority NOT IN ('low', 'medium', 'high') THEN
        RAISE EXCEPTION 'Invalid priority: %. Must be low, medium, or high', p_priority;
    END IF;
    
    IF p_source NOT IN ('email', 'phone', 'web', 'in_person', 'integration') THEN
        RAISE EXCEPTION 'Invalid source: %. Must be email, phone, web, in_person, or integration', p_source;
    END IF;

    -- Validate photo_urls if provided
    IF p_photo_url IS NOT NULL THEN
        IF array_to_string(p_photo_url, '|') !~ '^(https?://.*\|)*https?://.*$' THEN
            RAISE EXCEPTION 'Invalid photo URL format. All URLs must start with http:// or https://';
        END IF;
    END IF;
    
    -- Try to find existing client by company name (case-insensitive)
    SELECT * INTO v_client_record 
    FROM public.clients 
    WHERE LOWER(company_name) = LOWER(p_company_name)
    AND NOT is_provisional
    LIMIT 1;
    
    -- Get provisional client ID for unknown companies
    SELECT id INTO v_provisional_client_id
    FROM public.clients
    WHERE is_provisional
    LIMIT 1;
    
    -- Set client and review flag based on company match
    IF v_client_record IS NULL THEN
        v_client_record := (SELECT * FROM public.clients WHERE id = v_provisional_client_id);
        v_needs_company_review := TRUE;
    ELSE
        v_needs_company_review := FALSE;
    END IF;
    
    -- Create the ticket
    INSERT INTO public.tickets (
        title,
        description,
        status,
        priority,
        client_id,
        source,
        photo_url,
        needs_company_review
    ) VALUES (
        p_title,
        p_description,
        'pending_approval',
        p_priority::ticket_priority,
        v_client_record.id,
        p_source::ticket_source,
        p_photo_url,
        v_needs_company_review
    ) RETURNING id INTO v_new_ticket_id;
    
    -- Process service tags
    FOREACH v_service_tag_name IN ARRAY p_service_tag_names
    LOOP
        -- Check if service tag exists
        SELECT * INTO v_service_tag_record
        FROM public.service_tags
        WHERE LOWER(tag) = LOWER(v_service_tag_name)
        AND client_id = v_client_record.id;
        
        -- Create new service tag if it doesn't exist
        IF v_service_tag_record IS NULL THEN
            INSERT INTO public.service_tags (
                tag,
                description,
                client_id,
                hardware_type,
                location,
                is_auto_created
            ) VALUES (
                v_service_tag_name,
                'Auto-created from ticket submission',
                v_client_record.id,
                'Pending Review',
                'Pending Review',
                TRUE
            ) RETURNING * INTO v_service_tag_record;
            
            v_created_tags := v_created_tags || jsonb_build_object(
                'id', v_service_tag_record.id,
                'tag', v_service_tag_record.tag,
                'status', 'created'
            )::json;
        ELSE
            v_existing_tags := v_existing_tags || jsonb_build_object(
                'id', v_service_tag_record.id,
                'tag', v_service_tag_record.tag,
                'status', 'existing'
            )::json;
        END IF;
        
        -- Link service tag to ticket
        INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
        VALUES (v_new_ticket_id, v_service_tag_record.id);
    END LOOP;
    
    -- Prepare response
    v_result := jsonb_build_object(
        'success', TRUE,
        'ticket_id', v_new_ticket_id,
        'company_name', p_company_name,
        'using_provisional_company', v_needs_company_review,
        'created_service_tags', COALESCE(v_created_tags, '[]'::json[]),
        'existing_service_tags', COALESCE(v_existing_tags, '[]'::json[]),
        'message', CASE 
            WHEN v_needs_company_review THEN 'Ticket created with provisional company, pending admin review'
            ELSE 'Ticket created successfully, pending admin approval'
        END
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a ticket
CREATE OR REPLACE FUNCTION reject_ticket(
    p_ticket_id TEXT,
    p_admin_user_id UUID,
    p_rejection_reason TEXT
)
RETURNS JSON AS $$
DECLARE
    v_ticket_record RECORD;
    v_result JSON;
BEGIN
    -- Get ticket record
    SELECT * INTO v_ticket_record
    FROM public.tickets
    WHERE id = p_ticket_id;
    
    IF v_ticket_record IS NULL THEN
        RAISE EXCEPTION 'Ticket not found: %', p_ticket_id;
    END IF;
    
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = p_admin_user_id
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'User % is not an admin', p_admin_user_id;
    END IF;
    
    -- Reject the ticket
    UPDATE public.tickets
    SET status = 'rejected',
        rejected_by = p_admin_user_id,
        rejected_at = NOW(),
        rejection_reason = p_rejection_reason
    WHERE id = p_ticket_id;
    
    -- Add rejection update
    INSERT INTO public.ticket_updates (
        ticket_id,
        user_id,
        message
    ) VALUES (
        p_ticket_id,
        p_admin_user_id,
        'Ticket rejected: ' || p_rejection_reason
    );
    
    -- Prepare response
    v_result := jsonb_build_object(
        'success', TRUE,
        'ticket_id', p_ticket_id,
        'message', 'Ticket rejected successfully'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhance approve_ticket function to handle title/description changes
CREATE OR REPLACE FUNCTION approve_ticket(
    p_ticket_id TEXT,
    p_admin_user_id UUID,
    p_new_client_id UUID DEFAULT NULL,
    p_new_title TEXT DEFAULT NULL,
    p_new_description TEXT DEFAULT NULL,
    p_update_message TEXT DEFAULT 'Ticket approved by admin'
)
RETURNS JSON AS $$
DECLARE
    v_ticket_record RECORD;
    v_result JSON;
    v_changes TEXT[] := '{}';
BEGIN
    -- Get ticket record
    SELECT * INTO v_ticket_record
    FROM public.tickets
    WHERE id = p_ticket_id;
    
    IF v_ticket_record IS NULL THEN
        RAISE EXCEPTION 'Ticket not found: %', p_ticket_id;
    END IF;
    
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = p_admin_user_id
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'User % is not an admin', p_admin_user_id;
    END IF;
    
    -- Store original values if changing
    IF (p_new_title IS NOT NULL AND p_new_title != v_ticket_record.title) OR
       (p_new_description IS NOT NULL AND p_new_description != v_ticket_record.description) OR
       (p_new_client_id IS NOT NULL AND p_new_client_id != v_ticket_record.client_id) THEN
        UPDATE public.tickets
        SET original_title = title,
            original_description = description,
            original_client_id = client_id
        WHERE id = p_ticket_id;
    END IF;
    
    -- Update client if specified
    IF p_new_client_id IS NOT NULL THEN
        -- Verify new client exists and is not provisional
        IF NOT EXISTS (
            SELECT 1 FROM public.clients
            WHERE id = p_new_client_id
            AND NOT is_provisional
        ) THEN
            RAISE EXCEPTION 'Invalid client ID: %', p_new_client_id;
        END IF;
        
        -- Update ticket's client
        UPDATE public.tickets
        SET client_id = p_new_client_id,
            needs_company_review = FALSE
        WHERE id = p_ticket_id;
        
        -- Update service tags to new client
        UPDATE public.service_tags
        SET client_id = p_new_client_id
        WHERE id IN (
            SELECT service_tag_id
            FROM public.ticket_service_tags
            WHERE ticket_id = p_ticket_id
        );
        
        v_changes := array_append(v_changes, 'Updated client');
    END IF;
    
    -- Update title if specified
    IF p_new_title IS NOT NULL THEN
        UPDATE public.tickets
        SET title = p_new_title
        WHERE id = p_ticket_id;
        
        v_changes := array_append(v_changes, 'Updated title');
    END IF;
    
    -- Update description if specified
    IF p_new_description IS NOT NULL THEN
        UPDATE public.tickets
        SET description = p_new_description
        WHERE id = p_ticket_id;
        
        v_changes := array_append(v_changes, 'Updated description');
    END IF;
    
    -- Approve the ticket
    UPDATE public.tickets
    SET status = 'open',
        approved_by = p_admin_user_id,
        approved_at = NOW(),
        time_open = NOW()
    WHERE id = p_ticket_id;
    
    -- Add approval update with changes
    INSERT INTO public.ticket_updates (
        ticket_id,
        user_id,
        message
    ) VALUES (
        p_ticket_id,
        p_admin_user_id,
        CASE 
            WHEN array_length(v_changes, 1) > 0 
            THEN p_update_message || ' Changes made: ' || array_to_string(v_changes, ', ')
            ELSE p_update_message
        END
    );
    
    -- Prepare response
    v_result := jsonb_build_object(
        'success', TRUE,
        'ticket_id', p_ticket_id,
        'message', 'Ticket approved successfully',
        'changes_made', v_changes
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON public.clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_is_provisional ON public.clients(is_provisional);
CREATE INDEX IF NOT EXISTS idx_service_tags_tag ON public.service_tags(tag);
CREATE INDEX IF NOT EXISTS idx_service_tags_client_id ON public.service_tags(client_id);
CREATE INDEX IF NOT EXISTS idx_service_tags_is_auto_created ON public.service_tags(is_auto_created);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON public.tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_needs_company_review ON public.tickets(needs_company_review);
CREATE INDEX IF NOT EXISTS idx_ticket_service_tags_ticket_id ON public.ticket_service_tags(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_service_tags_service_tag_id ON public.ticket_service_tags(service_tag_id);
CREATE INDEX IF NOT EXISTS idx_ticket_updates_ticket_id ON public.ticket_updates(ticket_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_tags_updated_at
    BEFORE UPDATE ON public.service_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for tickets with related information
CREATE OR REPLACE VIEW public.tickets_with_details AS
SELECT 
    t.*,
    c.company_name as client_company_name,
    c.is_provisional as client_is_provisional,
    ru.name as reported_user_name,
    ru.email as reported_user_email,
    au.name as assigned_user_name,
    au.email as assigned_user_email,
    apu.name as approved_user_name,
    apu.email as approved_user_email,
    ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'id', st.id,
            'tag', st.tag,
            'description', st.description,
            'hardware_type', st.hardware_type,
            'location', st.location,
            'is_auto_created', st.is_auto_created
        )
    ) FILTER (WHERE st.id IS NOT NULL) as service_tags
FROM public.tickets t
JOIN public.clients c ON t.client_id = c.id
LEFT JOIN public.users ru ON t.reported_by = ru.id
LEFT JOIN public.users au ON t.assigned_to = au.id
LEFT JOIN public.users apu ON t.approved_by = apu.id
LEFT JOIN public.ticket_service_tags tst ON t.id = tst.ticket_id
LEFT JOIN public.service_tags st ON tst.service_tag_id = st.id
GROUP BY 
    t.id, 
    t.title, 
    t.description, 
    t.status, 
    t.priority,
    t.reported_by, 
    t.assigned_to, 
    t.client_id, 
    t.source,
    t.photo_url, 
    t.time_open, 
    t.time_closed,
    t.approved_by, 
    t.approved_at, 
    t.rejected_by, 
    t.rejected_at,
    t.rejection_reason, 
    t.needs_company_review,
    t.original_title, 
    t.original_description, 
    t.original_client_id,
    t.created_at, 
    t.updated_at,
    c.company_name, 
    c.is_provisional,
    ru.name, 
    ru.email,
    au.name, 
    au.email,
    apu.name, 
    apu.email;

-- Create view for pending approval tickets with all details
CREATE OR REPLACE VIEW public.pending_approval_tickets AS
SELECT 
    t.*,
    c.company_name as client_company_name,
    c.is_provisional as client_is_provisional,
    ru.name as reported_user_name,
    ru.email as reported_user_email,
    ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'id', st.id,
            'tag', st.tag,
            'description', st.description,
            'hardware_type', st.hardware_type,
            'location', st.location,
            'is_auto_created', st.is_auto_created
        )
    ) FILTER (WHERE st.id IS NOT NULL) as service_tags,
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE company_name = t.title 
        OR company_name ILIKE '%' || t.title || '%'
        OR company_name ILIKE '%' || t.description || '%'
    ) as possible_company_match
FROM public.tickets t
JOIN public.clients c ON t.client_id = c.id
LEFT JOIN public.users ru ON t.reported_by = ru.id
LEFT JOIN public.ticket_service_tags tst ON t.id = tst.ticket_id
LEFT JOIN public.service_tags st ON tst.service_tag_id = st.id
WHERE t.status = 'pending_approval'
GROUP BY 
    t.id, t.title, t.description, t.status, t.priority,
    t.reported_by, t.assigned_to, t.client_id, t.source,
    t.photo_url, t.time_open, t.time_closed,
    t.approved_by, t.approved_at, t.rejected_by, t.rejected_at,
    t.rejection_reason, t.needs_company_review,
    t.original_title, t.original_description, t.original_client_id,
    t.created_at, t.updated_at,
    c.company_name, c.is_provisional,
    ru.name, ru.email;

-- Create view for client tickets
CREATE OR REPLACE VIEW public.client_tickets AS
SELECT 
    t.*,
    c.company_name as client_company_name,
    ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'id', st.id,
            'tag', st.tag,
            'description', st.description
        )
    ) FILTER (WHERE st.id IS NOT NULL) as service_tags,
    ARRAY_AGG(
        jsonb_build_object(
            'message', tu.message,
            'created_at', tu.created_at,
            'user_name', u.name
        )
        ORDER BY tu.created_at DESC
    ) FILTER (WHERE tu.id IS NOT NULL) as updates
FROM public.tickets t
JOIN public.clients c ON t.client_id = c.id
LEFT JOIN public.ticket_service_tags tst ON t.id = tst.ticket_id
LEFT JOIN public.service_tags st ON tst.service_tag_id = st.id
LEFT JOIN public.ticket_updates tu ON t.id = tu.ticket_id
LEFT JOIN public.users u ON tu.user_id = u.id
GROUP BY 
    t.id, 
    t.title, 
    t.description, 
    t.status, 
    t.priority,
    t.reported_by, 
    t.assigned_to, 
    t.client_id, 
    t.source,
    t.photo_url, 
    t.time_open, 
    t.time_closed,
    t.approved_by, 
    t.approved_at, 
    t.rejected_by, 
    t.rejected_at,
    t.rejection_reason, 
    t.needs_company_review,
    t.original_title, 
    t.original_description, 
    t.original_client_id,
    t.created_at, 
    t.updated_at,
    c.company_name;

-- Grant necessary permissions
GRANT SELECT ON public.tickets_with_details TO authenticated;
GRANT SELECT ON public.pending_approval_tickets TO authenticated;
GRANT SELECT ON public.client_tickets TO authenticated;

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_service_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
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

CREATE POLICY "Users can view their own client" ON public.clients
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

CREATE POLICY "Users can view their client's service tags" ON public.service_tags
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

CREATE POLICY "Users can view and create tickets" ON public.tickets
    FOR SELECT USING (
        auth.uid() = reported_by OR 
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.clients c ON u.email = c.email
            WHERE u.id = auth.uid() AND c.id = tickets.client_id
        )
    );

CREATE POLICY "Users can create tickets" ON public.tickets
    FOR INSERT WITH CHECK (
        auth.uid() = reported_by OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.clients c ON u.email = c.email
            WHERE u.id = auth.uid() AND c.id = tickets.client_id
        )
    );

-- Ticket service tags policies
CREATE POLICY "Admins and technicians can manage ticket service tags" ON public.ticket_service_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'technician')
        )
    );

CREATE POLICY "Users can view their ticket service tags" ON public.ticket_service_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_service_tags.ticket_id
            AND (
                t.reported_by = auth.uid() OR
                t.assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.users u
                    JOIN public.clients c ON u.email = c.email
                    WHERE u.id = auth.uid() AND c.id = t.client_id
                )
            )
        )
    );

-- Ticket updates policies
CREATE POLICY "Admins and technicians can manage ticket updates" ON public.ticket_updates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'technician')
        )
    );

CREATE POLICY "Users can view updates for their tickets" ON public.ticket_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_updates.ticket_id
            AND (
                t.reported_by = auth.uid() OR
                t.assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.users u
                    JOIN public.clients c ON u.email = c.email
                    WHERE u.id = auth.uid() AND c.id = t.client_id
                )
            )
        )
    );

-- Update RLS policies for client access
CREATE POLICY "Clients can view their own tickets" ON public.tickets
    FOR SELECT USING (
        reported_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.clients c ON u.email = c.email
            WHERE u.id = auth.uid() 
            AND c.id = tickets.client_id
            AND NOT c.is_provisional
        )
    );

CREATE POLICY "Clients can view updates for their tickets" ON public.ticket_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_updates.ticket_id
            AND (
                t.reported_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.users u
                    JOIN public.clients c ON u.email = c.email
                    WHERE u.id = auth.uid() 
                    AND c.id = t.client_id
                    AND NOT c.is_provisional
                )
            )
        )
    );

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Created all tables with enhanced ticket management features';
    RAISE NOTICE 'Added provisional company support';
    RAISE NOTICE 'Added auto-creation of service tags';
    RAISE NOTICE 'Added approval workflow';
    RAISE NOTICE 'Created necessary indexes and policies';
END $$; 