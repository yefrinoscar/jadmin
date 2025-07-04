-- Migration: Public Ticket Submission API (Fixed Version)
-- Date: 2024-01-16
-- Description: 
-- Create function to handle public ticket submissions where company names and service tags may not exist.
-- These tickets will be created with pending_approval status for admin review.
-- FIXED: Handles the foreign key constraint issue with reported_by

-- ==================================================
-- STEP 1: Modify tickets table to allow NULL reported_by for public submissions
-- ==================================================

-- Temporarily allow NULL in reported_by for public submissions
-- We'll identify public submissions by the special source or other means
ALTER TABLE public.tickets ALTER COLUMN reported_by DROP NOT NULL;

-- ==================================================
-- STEP 2: Create function to handle public ticket submission
-- ==================================================

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
    p_photo_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    client_record RECORD;
    new_ticket_id TEXT;
    service_tag_record RECORD;
    service_tag_name TEXT;
    matched_tags JSON[] := '{}';
    unmatched_tags TEXT[] := '{}';
    result JSON;
BEGIN
    -- Validate priority and source
    IF p_priority NOT IN ('low', 'medium', 'high') THEN
        RAISE EXCEPTION 'Invalid priority: %. Must be low, medium, or high', p_priority;
    END IF;
    
    IF p_source NOT IN ('email', 'phone', 'web', 'in_person') THEN
        RAISE EXCEPTION 'Invalid source: %. Must be email, phone, web, or in_person', p_source;
    END IF;
    
    -- Try to find existing client by company name (case-insensitive)
    SELECT * INTO client_record 
    FROM public.clients 
    WHERE LOWER(company_name) = LOWER(p_company_name)
    LIMIT 1;
    
    -- If client doesn't exist, create a temporary/pending client
    IF client_record IS NULL THEN
        INSERT INTO public.clients (
            name, 
            email, 
            phone, 
            address, 
            company_name
        ) VALUES (
            p_contact_name,
            p_contact_email,
            p_contact_phone,
            'Pending verification - submitted via public form',
            p_company_name
        ) RETURNING * INTO client_record;
        
        RAISE NOTICE 'Created new client for company: %', p_company_name;
    END IF;
    
    -- Generate new ticket ID
    SELECT 'TK-' || LPAD(NEXTVAL('ticket_id_seq')::TEXT, 6, '0') INTO new_ticket_id;
    
    -- Create the ticket with pending_approval status and NULL reported_by for public submissions
    INSERT INTO public.tickets (
        id,
        title,
        description,
        status,
        priority,
        client_id,
        source,
        photo_url,
        reported_by
    ) VALUES (
        new_ticket_id,
        p_title,
        p_description,
        'pending_approval',
        p_priority::ticket_priority,
        client_record.id,
        p_source::ticket_source,
        p_photo_url,
        NULL  -- NULL for public submissions
    );
    
    -- Process service tags
    FOREACH service_tag_name IN ARRAY p_service_tag_names
    LOOP
        -- Try to find existing service tag for this client (case-insensitive)
        SELECT * INTO service_tag_record
        FROM public.service_tags 
        WHERE client_id = client_record.id 
        AND LOWER(tag) = LOWER(service_tag_name)
        LIMIT 1;
        
        IF service_tag_record IS NOT NULL THEN
            -- Service tag exists, associate it with the ticket
            INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
            VALUES (new_ticket_id, service_tag_record.id)
            ON CONFLICT (ticket_id, service_tag_id) DO NOTHING;
            
            -- Add to matched tags
            matched_tags := matched_tags || JSON_BUILD_OBJECT(
                'id', service_tag_record.id,
                'tag', service_tag_record.tag,
                'description', service_tag_record.description,
                'status', 'matched'
            );
        ELSE
            -- Service tag doesn't exist, create a temporary one
            INSERT INTO public.service_tags (
                tag,
                description,
                client_id,
                hardware_type,
                location
            ) VALUES (
                service_tag_name,
                'Temporary service tag created from public submission - requires admin verification',
                client_record.id,
                'Unknown - requires verification',
                'Unknown - requires verification'
            ) RETURNING * INTO service_tag_record;
            
            -- Associate the new service tag with the ticket
            INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
            VALUES (new_ticket_id, service_tag_record.id);
            
            -- Add to matched tags with pending status
            matched_tags := matched_tags || JSON_BUILD_OBJECT(
                'id', service_tag_record.id,
                'tag', service_tag_record.tag,
                'description', service_tag_record.description,
                'status', 'created_pending_verification'
            );
            
            RAISE NOTICE 'Created temporary service tag: % for client: %', service_tag_name, p_company_name;
        END IF;
    END LOOP;
    
    -- Build result JSON
    result := JSON_BUILD_OBJECT(
        'success', true,
        'ticket_id', new_ticket_id,
        'client_id', client_record.id,
        'company_name', client_record.company_name,
        'client_was_new', (client_record.address = 'Pending verification - submitted via public form'),
        'service_tags', matched_tags,
        'message', 'Ticket created successfully and is pending admin approval'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Handle any errors and return them in JSON format
    RETURN JSON_BUILD_OBJECT(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to create ticket: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- STEP 3: Grant permissions for the function
-- ==================================================

-- Grant execute permission on the function to anonymous users
GRANT EXECUTE ON FUNCTION create_public_ticket TO anon;
GRANT EXECUTE ON FUNCTION create_public_ticket TO authenticated;

-- ==================================================
-- STEP 4: Create helper function to get pending tickets for admin review
-- ==================================================

CREATE OR REPLACE FUNCTION get_pending_approval_tickets()
RETURNS TABLE(
    ticket_id TEXT,
    title TEXT,
    description TEXT,
    company_name TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    service_tags JSON,
    created_at TIMESTAMPTZ,
    client_was_new BOOLEAN,
    is_public_submission BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as ticket_id,
        t.title,
        t.description,
        c.company_name,
        c.name as contact_name,
        c.email as contact_email,
        c.phone as contact_phone,
        COALESCE(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', st.id,
                    'tag', st.tag,
                    'description', st.description,
                    'is_temporary', (st.description LIKE '%requires admin verification%')
                )
            ) FILTER (WHERE st.id IS NOT NULL),
            '[]'::JSON
        ) as service_tags,
        t.created_at,
        (c.address = 'Pending verification - submitted via public form') as client_was_new,
        (t.reported_by IS NULL) as is_public_submission
    FROM public.tickets t
    JOIN public.clients c ON t.client_id = c.id
    LEFT JOIN public.ticket_service_tags tst ON t.id = tst.ticket_id
    LEFT JOIN public.service_tags st ON tst.service_tag_id = st.id
    WHERE t.status = 'pending_approval'
    GROUP BY t.id, t.title, t.description, c.company_name, c.name, c.email, c.phone, t.created_at, c.address, t.reported_by
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for admins and technicians
GRANT EXECUTE ON FUNCTION get_pending_approval_tickets TO authenticated;

-- ==================================================
-- STEP 5: Create function to approve/reject public tickets
-- ==================================================

CREATE OR REPLACE FUNCTION approve_public_ticket(
    p_ticket_id TEXT,
    p_admin_user_id UUID,
    p_approved BOOLEAN,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    ticket_record RECORD;
    result JSON;
BEGIN
    -- Verify the ticket exists and is pending approval
    SELECT * INTO ticket_record
    FROM public.tickets
    WHERE id = p_ticket_id AND status = 'pending_approval';
    
    IF ticket_record IS NULL THEN
        RETURN JSON_BUILD_OBJECT(
            'success', false,
            'error', 'Ticket not found or not pending approval'
        );
    END IF;
    
    IF p_approved THEN
        -- Approve the ticket and assign the admin as reported_by if it's a public submission
        UPDATE public.tickets
        SET 
            status = 'open',
            approved_by = p_admin_user_id,
            approved_at = NOW(),
            time_open = NOW(),
            reported_by = COALESCE(reported_by, p_admin_user_id)  -- Assign admin if NULL (public submission)
        WHERE id = p_ticket_id;
        
        result := JSON_BUILD_OBJECT(
            'success', true,
            'action', 'approved',
            'ticket_id', p_ticket_id,
            'message', 'Ticket approved successfully'
        );
    ELSE
        -- Reject the ticket
        UPDATE public.tickets
        SET 
            status = 'closed',
            approved_by = p_admin_user_id,
            approved_at = NOW(),
            time_closed = NOW(),
            reported_by = COALESCE(reported_by, p_admin_user_id)  -- Assign admin if NULL (public submission)
        WHERE id = p_ticket_id;
        
        -- Add rejection reason as a ticket update
        IF p_rejection_reason IS NOT NULL THEN
            INSERT INTO public.ticket_updates (ticket_id, user_id, message)
            VALUES (p_ticket_id, p_admin_user_id, 'Ticket rejected: ' || p_rejection_reason);
        END IF;
        
        result := JSON_BUILD_OBJECT(
            'success', true,
            'action', 'rejected',
            'ticket_id', p_ticket_id,
            'message', 'Ticket rejected'
        );
    END IF;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN JSON_BUILD_OBJECT(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for admins and technicians
GRANT EXECUTE ON FUNCTION approve_public_ticket TO authenticated;

-- ==================================================
-- STEP 6: Update the tickets view to handle NULL reported_by
-- ==================================================

-- Drop the existing view first if it exists
DROP VIEW IF EXISTS public.tickets_with_service_tags;

-- Recreate the view to handle NULL reported_by
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

-- Grant necessary permissions on the view
GRANT SELECT ON public.tickets_with_service_tags TO authenticated;
GRANT SELECT ON public.tickets_with_service_tags TO anon;

-- ==================================================
-- STEP 7: Update RLS policies to handle public submissions
-- ==================================================

-- Drop existing policy that might conflict
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;

-- Create new policy that allows anonymous ticket creation for public submissions
CREATE POLICY "Users can create tickets" ON public.tickets
    FOR INSERT WITH CHECK (
        -- Authenticated users can create tickets for themselves
        (auth.uid() IS NOT NULL AND auth.uid() = reported_by) OR
        -- Anonymous users can create public submissions (reported_by = NULL, status = pending_approval)
        (auth.uid() IS NULL AND reported_by IS NULL AND status = 'pending_approval')
    );

-- Update the view policy for anonymous access to pending tickets (for status checking)
CREATE POLICY "Anonymous can view pending approval tickets" ON public.tickets
    FOR SELECT USING (
        status = 'pending_approval' AND reported_by IS NULL
    );

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 008 (Fixed) completed successfully!';
    RAISE NOTICE 'Created function: create_public_ticket';
    RAISE NOTICE 'Created function: get_pending_approval_tickets';
    RAISE NOTICE 'Created function: approve_public_ticket';
    RAISE NOTICE 'Updated tickets table to allow NULL reported_by for public submissions';
    RAISE NOTICE 'Updated RLS policies for anonymous public submissions';
    RAISE NOTICE 'Public ticket submission API is ready!';
END $$; 