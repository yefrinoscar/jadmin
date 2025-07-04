-- Migration: Enforce Company Constraint for Tickets
-- Date: 2024-01-16
-- Description: 
-- 1. Add client_id to tickets table
-- 2. Create constraint that ensures all service tags for a ticket belong to the same client
-- 3. Update functions to validate this constraint
-- 4. Migrate existing data

-- ==================================================
-- STEP 1: Add client_id to tickets table
-- ==================================================

-- Add client_id column to tickets table
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON public.tickets(client_id);

-- ==================================================
-- STEP 2: Migrate existing data
-- ==================================================

-- Update existing tickets to have client_id based on their service tags
-- For tickets with multiple service tags from different clients, we'll use the first one
UPDATE public.tickets 
SET client_id = (
    SELECT DISTINCT st.client_id 
    FROM public.ticket_service_tags tst
    JOIN public.service_tags st ON tst.service_tag_id = st.id
    WHERE tst.ticket_id = tickets.id
    LIMIT 1
)
WHERE client_id IS NULL;

-- ==================================================
-- STEP 3: Make client_id NOT NULL after migration
-- ==================================================

-- Make client_id required
ALTER TABLE public.tickets ALTER COLUMN client_id SET NOT NULL;

-- ==================================================
-- STEP 4: Create constraint function
-- ==================================================

-- Function to validate that all service tags belong to the same client as the ticket
CREATE OR REPLACE FUNCTION validate_ticket_service_tags_client()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the service tag belongs to the same client as the ticket
    IF NOT EXISTS (
        SELECT 1 
        FROM public.tickets t
        JOIN public.service_tags st ON st.client_id = t.client_id
        WHERE t.id = NEW.ticket_id AND st.id = NEW.service_tag_id
    ) THEN
        RAISE EXCEPTION 'Service tag % does not belong to the same client as ticket %', 
            NEW.service_tag_id, NEW.ticket_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate service tag assignments
CREATE TRIGGER validate_ticket_service_tags_client_trigger
    BEFORE INSERT OR UPDATE ON public.ticket_service_tags
    FOR EACH ROW
    EXECUTE FUNCTION validate_ticket_service_tags_client();

-- ==================================================
-- STEP 5: Update the add_service_tag_to_ticket function
-- ==================================================

-- Update function to include client validation
CREATE OR REPLACE FUNCTION add_service_tag_to_ticket(
    p_ticket_id TEXT,
    p_service_tag_id TEXT
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
    ticket_client_id UUID;
    service_tag_client_id UUID;
BEGIN
    -- Get the client_id for the ticket
    SELECT client_id INTO ticket_client_id
    FROM public.tickets
    WHERE id = p_ticket_id;
    
    IF ticket_client_id IS NULL THEN
        RAISE EXCEPTION 'Ticket % not found', p_ticket_id;
    END IF;
    
    -- Get the client_id for the service tag
    SELECT client_id INTO service_tag_client_id
    FROM public.service_tags
    WHERE id = p_service_tag_id;
    
    IF service_tag_client_id IS NULL THEN
        RAISE EXCEPTION 'Service tag % not found', p_service_tag_id;
    END IF;
    
    -- Validate that both belong to the same client
    IF ticket_client_id != service_tag_client_id THEN
        RAISE EXCEPTION 'Service tag % belongs to a different client than ticket %', 
            p_service_tag_id, p_ticket_id;
    END IF;
    
    -- Check if relationship already exists
    IF EXISTS (
        SELECT 1 FROM public.ticket_service_tags 
        WHERE ticket_id = p_ticket_id AND service_tag_id = p_service_tag_id
    ) THEN
        RAISE EXCEPTION 'Service tag % is already associated with ticket %', 
            p_service_tag_id, p_ticket_id;
    END IF;
    
    -- Insert new relationship
    INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
    VALUES (p_ticket_id, p_service_tag_id)
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- STEP 6: Update the tickets view
-- ==================================================

-- Drop the existing view first
DROP VIEW IF EXISTS public.tickets_with_service_tags;

-- Create the updated view to include client information
CREATE VIEW public.tickets_with_service_tags AS
SELECT 
    t.*,
    c.company_name as client_company_name,
    ARRAY_AGG(
        CASE 
            WHEN st.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                    'id', st.id,
                    'tag', st.tag,
                    'description', st.description,
                    'hardware_type', st.hardware_type,
                    'location', st.location,
                    'client_name', c.company_name
                )
            ELSE NULL
        END
    ) FILTER (WHERE st.id IS NOT NULL) as service_tags
FROM public.tickets t
JOIN public.clients c ON t.client_id = c.id
LEFT JOIN public.ticket_service_tags tst ON t.id = tst.ticket_id
LEFT JOIN public.service_tags st ON tst.service_tag_id = st.id
GROUP BY t.id, t.title, t.description, t.status, t.priority, t.reported_by, 
         t.assigned_to, t.source, t.photo_url, t.time_open, t.time_closed, 
         t.approved_by, t.approved_at, t.created_at, t.updated_at, t.client_id,
         c.company_name;

-- ==================================================
-- STEP 7: Update RLS policies
-- ==================================================

-- Update client policy for viewing tickets
DROP POLICY IF EXISTS "Clients can view their tickets through service tags" ON public.tickets;

-- Create new policy using the direct client_id relationship
CREATE POLICY "Clients can view their tickets" ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.clients c ON u.email = c.email
            WHERE u.id = auth.uid() AND c.id = tickets.client_id
        )
    );

-- ==================================================
-- STEP 8: Clean up existing data that violates the constraint
-- ==================================================

-- Remove service tag relationships that don't match the ticket's client
DELETE FROM public.ticket_service_tags
WHERE id IN (
    SELECT tst.id
    FROM public.ticket_service_tags tst
    JOIN public.tickets t ON tst.ticket_id = t.id
    JOIN public.service_tags st ON tst.service_tag_id = st.id
    WHERE t.client_id != st.client_id
);

-- ==================================================
-- STEP 9: Create helper functions
-- ==================================================

-- Function to get service tags for a specific client
CREATE OR REPLACE FUNCTION get_service_tags_for_client(p_client_id UUID)
RETURNS TABLE(
    service_tag_id TEXT,
    tag TEXT,
    description TEXT,
    hardware_type TEXT,
    location TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.id as service_tag_id,
        st.tag,
        st.description,
        st.hardware_type,
        st.location
    FROM public.service_tags st
    WHERE st.client_id = p_client_id
    ORDER BY st.tag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate ticket creation with client
CREATE OR REPLACE FUNCTION create_ticket_with_client_validation(
    p_title TEXT,
    p_description TEXT,
    p_client_id UUID,
    p_service_tag_ids TEXT[],
    p_priority TEXT DEFAULT 'medium',
    p_source TEXT DEFAULT 'web',
    p_reported_by UUID DEFAULT auth.uid()
)
RETURNS TEXT AS $$
DECLARE
    new_ticket_id TEXT;
    service_tag_id TEXT;
    invalid_tags TEXT[];
    ticket_client_id UUID;
    service_tag_client_id UUID;
BEGIN
    ticket_client_id := p_client_id;
    -- Validate that all service tags belong to the specified client
    SELECT ARRAY_AGG(st_id) INTO invalid_tags
    FROM UNNEST(p_service_tag_ids) AS st_id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.service_tags st
        WHERE st.id = st_id AND st.client_id = p_client_id
    );
    
    IF array_length(invalid_tags, 1) > 0 THEN
        RAISE EXCEPTION 'Service tags % do not belong to the specified client', invalid_tags;
    END IF;
    
    -- Generate new ticket ID
    SELECT 'TK-' || LPAD(NEXTVAL('ticket_id_seq')::TEXT, 6, '0') INTO new_ticket_id;
    
    -- Create the ticket
    INSERT INTO public.tickets (
        id, title, description, client_id, priority, source, reported_by
    ) VALUES (
        new_ticket_id, p_title, p_description, p_client_id, p_priority::ticket_priority, p_source::ticket_source, p_reported_by
    );
    
    -- Add service tags
    FOREACH service_tag_id IN ARRAY p_service_tag_ids
    LOOP
        INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
        VALUES (new_ticket_id, service_tag_id);
    END LOOP;
    
    RETURN new_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 007 completed successfully!';
    RAISE NOTICE 'Added client_id column to tickets table';
    RAISE NOTICE 'Created constraint to ensure service tags belong to same client';
    RAISE NOTICE 'Updated functions and views';
    RAISE NOTICE 'Updated RLS policies';
    RAISE NOTICE 'Cleaned up existing data';
END $$; 