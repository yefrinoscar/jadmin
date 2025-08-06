-- Migration: Enhanced Provisional Ticket Workflow
-- Date: 2025-08-06
-- Description: Adds functionality to support temporary companies and service tags for public tickets

-- Add function to create a temporary company for a ticket
CREATE OR REPLACE FUNCTION create_temporary_company(
    p_company_name TEXT,
    p_contact_name TEXT,
    p_contact_email TEXT,
    p_contact_phone TEXT
)
RETURNS UUID AS $$
DECLARE
    v_company_id UUID;
BEGIN
    -- Create a new temporary company
    INSERT INTO public.clients (
        name,
        email,
        phone,
        address,
        company_name,
        is_provisional
    ) VALUES (
        p_contact_name,
        p_contact_email,
        p_contact_phone,
        'Pending verification',
        p_company_name,
        TRUE
    ) RETURNING id INTO v_company_id;
    
    RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to create temporary service tags for a company
CREATE OR REPLACE FUNCTION create_temporary_service_tags(
    p_company_id UUID,
    p_service_tag_names TEXT[]
)
RETURNS TEXT[] AS $$
DECLARE
    v_service_tag_ids TEXT[] := '{}';
    v_service_tag_name TEXT;
    v_service_tag_id TEXT;
BEGIN
    -- Create service tags for each name
    FOREACH v_service_tag_name IN ARRAY p_service_tag_names
    LOOP
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
            p_company_id,
            'Pending Review',
            'Pending Review',
            TRUE
        ) RETURNING id INTO v_service_tag_id;
        
        v_service_tag_ids := array_append(v_service_tag_ids, v_service_tag_id);
    END LOOP;
    
    RETURN v_service_tag_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to reassign a ticket to a different company and service tags
CREATE OR REPLACE FUNCTION reassign_ticket_company(
    p_ticket_id TEXT,
    p_new_company_id UUID,
    p_new_service_tag_ids TEXT[],
    p_admin_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_ticket_record RECORD;
    v_old_company_id UUID;
    v_old_service_tag_ids TEXT[];
    v_service_tag_id TEXT;
    v_result JSON;
BEGIN
    -- Get ticket record
    SELECT * INTO v_ticket_record
    FROM public.tickets
    WHERE id = p_ticket_id;
    
    IF v_ticket_record IS NULL THEN
        RAISE EXCEPTION 'Ticket with ID % not found', p_ticket_id;
    END IF;
    
    -- Store old company ID
    v_old_company_id := v_ticket_record.client_id;
    
    -- Get old service tag IDs
    SELECT array_agg(service_tag_id) INTO v_old_service_tag_ids
    FROM public.ticket_service_tags
    WHERE ticket_id = p_ticket_id;
    
    -- Update ticket with new company
    UPDATE public.tickets
    SET 
        client_id = p_new_company_id,
        needs_company_review = FALSE,
        approved_by = p_admin_user_id,
        approved_at = NOW()
    WHERE id = p_ticket_id;
    
    -- Remove old service tag associations
    DELETE FROM public.ticket_service_tags
    WHERE ticket_id = p_ticket_id;
    
    -- Add new service tag associations
    FOREACH v_service_tag_id IN ARRAY p_new_service_tag_ids
    LOOP
        INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
        VALUES (p_ticket_id, v_service_tag_id);
    END LOOP;
    
    -- Add ticket update for reassignment
    INSERT INTO public.ticket_updates (
        ticket_id,
        user_id,
        message
    ) VALUES (
        p_ticket_id,
        p_admin_user_id,
        'Ticket reassigned to a different company and service tags by admin'
    );
    
    -- Prepare response
    v_result := jsonb_build_object(
        'success', TRUE,
        'ticket_id', p_ticket_id,
        'old_company_id', v_old_company_id,
        'new_company_id', p_new_company_id,
        'old_service_tag_ids', v_old_service_tag_ids,
        'new_service_tag_ids', p_new_service_tag_ids,
        'message', 'Ticket successfully reassigned to new company and service tags'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to approve a provisional ticket without changing company
CREATE OR REPLACE FUNCTION approve_provisional_ticket(
    p_ticket_id TEXT,
    p_admin_user_id UUID
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
        RAISE EXCEPTION 'Ticket with ID % not found', p_ticket_id;
    END IF;
    
    -- Update ticket status
    UPDATE public.tickets
    SET 
        status = 'open',
        needs_company_review = FALSE,
        approved_by = p_admin_user_id,
        approved_at = NOW(),
        time_open = NOW()
    WHERE id = p_ticket_id;
    
    -- Add ticket update for approval
    INSERT INTO public.ticket_updates (
        ticket_id,
        user_id,
        message
    ) VALUES (
        p_ticket_id,
        p_admin_user_id,
        'Ticket approved with provisional company by admin'
    );
    
    -- Prepare response
    v_result := jsonb_build_object(
        'success', TRUE,
        'ticket_id', p_ticket_id,
        'company_id', v_ticket_record.client_id,
        'message', 'Ticket successfully approved with provisional company'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
