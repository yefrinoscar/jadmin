-- Migration: Support Multiple Service Tags per Ticket
-- Date: 2024-01-16
-- Description: 
-- 1. Create junction table to support many-to-many relationship between tickets and service tags
-- 2. Migrate existing single service_tag_id data to the new junction table
-- 3. Remove the old service_tag_id column from tickets table
-- 4. Update indexes and constraints

-- ==================================================
-- STEP 1: Create junction table for ticket-service_tag relationship
-- ==================================================

-- Create the junction table
CREATE TABLE IF NOT EXISTS public.ticket_service_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id TEXT REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    service_tag_id TEXT REFERENCES public.service_tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure unique combination of ticket_id and service_tag_id
    UNIQUE(ticket_id, service_tag_id)
);

-- ==================================================
-- STEP 2: Migrate existing data from tickets.service_tag_id
-- ==================================================

-- Only migrate if the old service_tag_id column still exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'service_tag_id'
    ) THEN
        -- Migrate existing single service tag relationships
        INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id, created_at)
        SELECT 
            t.id as ticket_id,
            t.service_tag_id,
            t.created_at
        FROM public.tickets t
        WHERE t.service_tag_id IS NOT NULL
        ON CONFLICT (ticket_id, service_tag_id) DO NOTHING;
        
        RAISE NOTICE 'Migrated % existing service tag relationships', 
            (SELECT COUNT(*) FROM public.ticket_service_tags);
    ELSE
        RAISE NOTICE 'service_tag_id column not found in tickets table. Migration may have already been applied.';
    END IF;
END $$;

-- ==================================================
-- STEP 3: Remove old service_tag_id column from tickets table
-- ==================================================

-- Drop the foreign key constraint first
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_service_tag_id_fkey;

-- Drop the index
DROP INDEX IF EXISTS idx_tickets_service_tag_id_new;
DROP INDEX IF EXISTS idx_tickets_service_tag_id;

-- Drop the column
ALTER TABLE public.tickets DROP COLUMN IF EXISTS service_tag_id;

-- ==================================================
-- STEP 4: Create indexes for the new junction table
-- ==================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ticket_service_tags_ticket_id ON public.ticket_service_tags(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_service_tags_service_tag_id ON public.ticket_service_tags(service_tag_id);
CREATE INDEX IF NOT EXISTS idx_ticket_service_tags_created_at ON public.ticket_service_tags(created_at);

-- ==================================================
-- STEP 5: Enable Row Level Security (RLS) for the junction table
-- ==================================================

-- Enable RLS on the junction table
ALTER TABLE public.ticket_service_tags ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- STEP 6: Create RLS policies for the junction table
-- ==================================================

-- Admins and technicians can manage all ticket service tag relationships
CREATE POLICY "Admins and technicians can manage all ticket service tags" ON public.ticket_service_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'technician')
        )
    );

-- Users can view ticket service tags for tickets they reported or are assigned to
CREATE POLICY "Users can view ticket service tags for their tickets" ON public.ticket_service_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_service_tags.ticket_id 
            AND (t.reported_by = auth.uid() OR t.assigned_to = auth.uid())
        )
    );

-- Clients can view ticket service tags for their service tags
CREATE POLICY "Clients can view ticket service tags for their service tags" ON public.ticket_service_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.clients c ON u.email = c.email
            JOIN public.service_tags st ON c.id = st.client_id
            WHERE u.id = auth.uid() AND st.id = ticket_service_tags.service_tag_id
        )
    );

-- ==================================================
-- STEP 7: Create helper functions for managing ticket service tags
-- ==================================================

-- Function to add a service tag to a ticket
CREATE OR REPLACE FUNCTION add_service_tag_to_ticket(
    p_ticket_id TEXT,
    p_service_tag_id TEXT
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    -- Check if relationship already exists
    IF EXISTS (
        SELECT 1 FROM public.ticket_service_tags 
        WHERE ticket_id = p_ticket_id AND service_tag_id = p_service_tag_id
    ) THEN
        RAISE EXCEPTION 'Service tag % is already associated with ticket %', p_service_tag_id, p_ticket_id;
    END IF;
    
    -- Insert new relationship
    INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
    VALUES (p_ticket_id, p_service_tag_id)
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a service tag from a ticket
CREATE OR REPLACE FUNCTION remove_service_tag_from_ticket(
    p_ticket_id TEXT,
    p_service_tag_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_deleted INTEGER;
BEGIN
    DELETE FROM public.ticket_service_tags 
    WHERE ticket_id = p_ticket_id AND service_tag_id = p_service_tag_id;
    
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    
    RETURN rows_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all service tags for a ticket
CREATE OR REPLACE FUNCTION get_ticket_service_tags(p_ticket_id TEXT)
RETURNS TABLE(
    service_tag_id TEXT,
    tag TEXT,
    description TEXT,
    client_name TEXT,
    hardware_type TEXT,
    location TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.id as service_tag_id,
        st.tag,
        st.description,
        c.company_name as client_name,
        st.hardware_type,
        st.location
    FROM public.ticket_service_tags tst
    JOIN public.service_tags st ON tst.service_tag_id = st.id
    JOIN public.clients c ON st.client_id = c.id
    WHERE tst.ticket_id = p_ticket_id
    ORDER BY st.tag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all tickets for a service tag
CREATE OR REPLACE FUNCTION get_service_tag_tickets(p_service_tag_id TEXT)
RETURNS TABLE(
    ticket_id TEXT,
    title TEXT,
    status TEXT,
    priority TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as ticket_id,
        t.title,
        t.status::TEXT,
        t.priority::TEXT,
        t.created_at
    FROM public.ticket_service_tags tst
    JOIN public.tickets t ON tst.ticket_id = t.id
    WHERE tst.service_tag_id = p_service_tag_id
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- STEP 8: Create view for easier querying
-- ==================================================

-- Create a view that includes service tags information with tickets
CREATE OR REPLACE VIEW public.tickets_with_service_tags AS
SELECT 
    t.*,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'id', st.id,
            'tag', st.tag,
            'description', st.description,
            'hardware_type', st.hardware_type,
            'location', st.location,
            'client_name', c.company_name
        )
    ) as service_tags
FROM public.tickets t
LEFT JOIN public.ticket_service_tags tst ON t.id = tst.ticket_id
LEFT JOIN public.service_tags st ON tst.service_tag_id = st.id
LEFT JOIN public.clients c ON st.client_id = c.id
GROUP BY t.id, t.title, t.description, t.status, t.priority, t.reported_by, 
         t.assigned_to, t.source, t.photo_url, t.time_open, t.time_closed, 
         t.approved_by, t.approved_at, t.created_at, t.updated_at;

-- Grant necessary permissions on the view
GRANT SELECT ON public.tickets_with_service_tags TO authenticated;

-- ==================================================
-- STEP 9: Update existing RLS policies that referenced service_tag_id
-- ==================================================

-- Note: The old ticket RLS policies that used service_tag_id will need to be updated
-- to work with the new junction table structure. This should be done carefully
-- to ensure security is maintained.

-- Drop old policies that might reference the removed service_tag_id column
DROP POLICY IF EXISTS "Clients can view their tickets" ON public.tickets;

-- Create new policy for clients to view their tickets through service tags
CREATE POLICY "Clients can view their tickets through service tags" ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.clients c ON u.email = c.email
            JOIN public.service_tags st ON c.id = st.client_id
            JOIN public.ticket_service_tags tst ON st.id = tst.service_tag_id
            WHERE u.id = auth.uid() AND tst.ticket_id = tickets.id
        )
    );

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Created junction table: ticket_service_tags';
    RAISE NOTICE 'Migrated existing service tag relationships';
    RAISE NOTICE 'Removed old service_tag_id column from tickets table';
    RAISE NOTICE 'Created helper functions and views';
    RAISE NOTICE 'Updated RLS policies';
END $$; 