-- Migration: Fix Service Tags Constraint
-- Date: 2025-08-14
-- Description: Change service_tags table to allow same tag for different clients

-- Drop the existing unique constraint on tag column
ALTER TABLE public.service_tags DROP CONSTRAINT IF EXISTS service_tags_tag_key;

-- Add a new composite unique constraint for client_id and tag
ALTER TABLE public.service_tags ADD CONSTRAINT service_tags_client_id_tag_key UNIQUE (client_id, tag);

-- Update the function that creates public tickets to match the new constraint
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
        -- Check if service tag exists for this specific client
        SELECT * INTO v_service_tag_record
        FROM public.service_tags
        WHERE LOWER(tag) = LOWER(v_service_tag_name)
        AND client_id = v_client_record.id;
        
        -- Create new service tag if it doesn't exist for this client
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
