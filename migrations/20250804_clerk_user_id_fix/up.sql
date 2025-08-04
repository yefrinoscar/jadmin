-- Migration: Change client_id column type from UUID to TEXT
-- Date: 2025-08-04
-- Description: Modifies the client_id column in users table to accept Clerk user IDs

-- First, save the existing view definitions so we can recreate them later
CREATE OR REPLACE FUNCTION save_view_definition(view_name text) RETURNS text AS $$
DECLARE
    view_def text;
BEGIN
    SELECT pg_get_viewdef(view_name::regclass, true) INTO view_def;
    RETURN view_def;
END;
$$ LANGUAGE plpgsql;

-- Save view definitions
DO $$
DECLARE
    tickets_with_details_def text;
    pending_approval_tickets_def text;
    client_tickets_def text;
    active_ticket_comments_def text;
BEGIN
    -- Get the view definitions
    SELECT pg_get_viewdef('public.tickets_with_details'::regclass) INTO tickets_with_details_def;
    SELECT pg_get_viewdef('public.pending_approval_tickets'::regclass) INTO pending_approval_tickets_def;
    SELECT pg_get_viewdef('public.client_tickets'::regclass) INTO client_tickets_def;
    SELECT pg_get_viewdef('public.active_ticket_comments'::regclass) INTO active_ticket_comments_def;
    
    -- Store the view definitions in a temporary table
    CREATE TEMP TABLE temp_view_defs (
        view_name text,
        definition text
    );
    
    INSERT INTO temp_view_defs VALUES 
        ('tickets_with_details', tickets_with_details_def),
        ('pending_approval_tickets', pending_approval_tickets_def),
        ('client_tickets', client_tickets_def),
        ('active_ticket_comments', active_ticket_comments_def);
END;
$$;

-- Drop dependent views
DROP VIEW IF EXISTS public.client_tickets;
DROP VIEW IF EXISTS public.pending_approval_tickets;
DROP VIEW IF EXISTS public.tickets_with_details;
DROP VIEW IF EXISTS public.active_ticket_comments;

-- Drop all foreign key constraints referencing clients.id and users.id
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_client_id_fkey;
ALTER TABLE public.service_tags DROP CONSTRAINT IF EXISTS service_tags_client_id_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_client_id_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_original_client_id_fkey;

-- Drop foreign keys referencing users.id
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_reported_by_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_approved_by_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_rejected_by_fkey;
ALTER TABLE public.ticket_updates DROP CONSTRAINT IF EXISTS ticket_updates_user_id_fkey;
-- Drop users_id_fkey constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
-- Drop ticket_comments_user_id_fkey constraint
ALTER TABLE public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_user_id_fkey;
-- Drop ticket_comments_deleted_by_fkey constraint
ALTER TABLE public.ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_deleted_by_fkey;

-- Change the column types from UUID to TEXT
-- Change users.id to TEXT for Clerk user IDs
ALTER TABLE public.users 
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

ALTER TABLE public.users 
  ALTER COLUMN client_id TYPE TEXT USING client_id::TEXT;

ALTER TABLE public.service_tags 
  ALTER COLUMN client_id TYPE TEXT USING client_id::TEXT;

ALTER TABLE public.tickets 
  ALTER COLUMN client_id TYPE TEXT USING client_id::TEXT;

ALTER TABLE public.tickets 
  ALTER COLUMN original_client_id TYPE TEXT USING original_client_id::TEXT;

-- Change user reference columns in tickets table
ALTER TABLE public.tickets 
  ALTER COLUMN reported_by TYPE TEXT USING reported_by::TEXT;

ALTER TABLE public.tickets 
  ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;

ALTER TABLE public.tickets 
  ALTER COLUMN approved_by TYPE TEXT USING approved_by::TEXT;

ALTER TABLE public.tickets 
  ALTER COLUMN rejected_by TYPE TEXT USING rejected_by::TEXT;

-- Change user reference columns in ticket_updates table
ALTER TABLE public.ticket_updates 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Change user reference columns in ticket_comments table
ALTER TABLE public.ticket_comments 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE public.ticket_comments 
  ALTER COLUMN deleted_by TYPE TEXT USING deleted_by::TEXT;

-- Change the primary key type in clients table from UUID to TEXT
ALTER TABLE public.clients 
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Re-add the foreign key constraints with the new type
ALTER TABLE public.users 
  ADD CONSTRAINT users_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE SET NULL;

ALTER TABLE public.service_tags 
  ADD CONSTRAINT service_tags_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE CASCADE;

ALTER TABLE public.tickets 
  ADD CONSTRAINT tickets_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE CASCADE;

ALTER TABLE public.tickets 
  ADD CONSTRAINT tickets_original_client_id_fkey 
  FOREIGN KEY (original_client_id) 
  REFERENCES public.clients(id) 
  ON DELETE SET NULL;

-- Re-add foreign key constraints referencing users.id
ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_reported_by_fkey
  FOREIGN KEY (reported_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_assigned_to_fkey
  FOREIGN KEY (assigned_to)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_approved_by_fkey
  FOREIGN KEY (approved_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_rejected_by_fkey
  FOREIGN KEY (rejected_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.ticket_updates
  ADD CONSTRAINT ticket_updates_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.ticket_comments
  ADD CONSTRAINT ticket_comments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.ticket_comments
  ADD CONSTRAINT ticket_comments_deleted_by_fkey
  FOREIGN KEY (deleted_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Recreate views
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
    t.id, t.title, t.description, t.status, t.priority,
    t.reported_by, t.assigned_to, t.client_id, t.source,
    t.photo_url, t.time_open, t.time_closed,
    t.approved_by, t.approved_at, t.rejected_by, t.rejected_at,
    t.rejection_reason, t.needs_company_review,
    t.original_title, t.original_description, t.original_client_id,
    t.created_at, t.updated_at,
    c.company_name;

-- Recreate active_ticket_comments view
DO $$
DECLARE
    active_ticket_comments_def text;
BEGIN
    SELECT definition INTO active_ticket_comments_def FROM temp_view_defs WHERE view_name = 'active_ticket_comments';
    EXECUTE active_ticket_comments_def;
END;
$$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Changed client_id column type from UUID to TEXT to support Clerk user IDs';
END $$;
