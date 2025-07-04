-- Migration: Improve ID conventions and simplify priorities
-- Date: 2024-01-15
-- Description: 
-- 1. Create shorter, more readable IDs for tickets and service tags
-- 2. Simplify priority levels to only: low, medium, high (remove critical)
-- 3. Add admin approval system for pending tickets

-- ==================================================
-- STEP 0: Check if migration has already been applied
-- ==================================================

-- Check if the new ticket priority enum already exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority_new') THEN
        RAISE NOTICE 'Migration appears to have been partially applied. Checking tables...';
    END IF;
END $$;

-- ==================================================
-- STEP 1: Create new ID generation functions
-- ==================================================

-- Function to generate ticket IDs (TK-000001, TK-000002, etc.)
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    formatted_id TEXT;
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)), 0) + 1 
    INTO next_id
    FROM tickets 
    WHERE id LIKE 'TK-%';
    
    -- Format with leading zeros (6 digits)
    formatted_id := 'TK-' || LPAD(next_id::TEXT, 6, '0');
    
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate service tag IDs (ST-000001, ST-000002, etc.)  
CREATE OR REPLACE FUNCTION generate_service_tag_id()
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    formatted_id TEXT;
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)), 0) + 1 
    INTO next_id
    FROM service_tags 
    WHERE id LIKE 'ST-%';
    
    -- Format with leading zeros (6 digits)
    formatted_id := 'ST-' || LPAD(next_id::TEXT, 6, '0');
    
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- STEP 2: Create new priority enum with only 3 levels (English)
-- ==================================================

-- Create new priority enum with English values (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority_new') THEN
        CREATE TYPE ticket_priority_new AS ENUM ('low', 'medium', 'high');
    END IF;
END $$;

-- Create new ticket status enum with pending approval (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status_new') THEN
        CREATE TYPE ticket_status_new AS ENUM ('pending_approval', 'open', 'in_progress', 'resolved', 'closed');
    END IF;
END $$;

-- ==================================================
-- STEP 3: Only proceed with migration if tables haven't been migrated yet
-- ==================================================

DO $$
BEGIN
    -- Check if tables have been migrated (by checking if tickets.id is TEXT)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'id' 
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE 'Tables appear to have been migrated already. Skipping data migration.';
    ELSE
        RAISE NOTICE 'Starting table migration...';
        
        -- ==================================================
        -- STEP 4: Backup existing data and create new tables
        -- ==================================================

                 -- Create backup tables for existing data (drop if exists first)
         DROP TABLE IF EXISTS tickets_backup CASCADE;
         DROP TABLE IF EXISTS service_tags_backup CASCADE;
         DROP TABLE IF EXISTS ticket_updates_backup CASCADE;
         
         CREATE TABLE tickets_backup AS SELECT * FROM tickets;
         CREATE TABLE service_tags_backup AS SELECT * FROM service_tags;
         CREATE TABLE ticket_updates_backup AS SELECT * FROM ticket_updates;

        -- ==================================================
        -- STEP 5: Drop existing tables and recreate with new structure
        -- ==================================================

        -- Drop foreign key constraints first
        ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_service_tag_id_fkey;
        ALTER TABLE ticket_updates DROP CONSTRAINT IF EXISTS ticket_updates_ticket_id_fkey;

        -- Drop triggers
        DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
        DROP TRIGGER IF EXISTS update_service_tags_updated_at ON service_tags;

        -- Drop existing tables
        DROP TABLE IF EXISTS ticket_updates CASCADE;
        DROP TABLE IF EXISTS tickets CASCADE;
        DROP TABLE IF EXISTS service_tags CASCADE;

        -- ==================================================
        -- STEP 6: Recreate service_tags table with new ID system
        -- ==================================================

        CREATE TABLE public.service_tags (
            id TEXT PRIMARY KEY DEFAULT generate_service_tag_id(),
            tag TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
            hardware_type TEXT NOT NULL,
            location TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- ==================================================
        -- STEP 7: Recreate tickets table with new ID system and priorities
        -- ==================================================

        CREATE TABLE public.tickets (
            id TEXT PRIMARY KEY DEFAULT generate_ticket_id(),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            status ticket_status_new DEFAULT 'pending_approval',
            priority ticket_priority_new NOT NULL,
            reported_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
            assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
            service_tag_id TEXT REFERENCES public.service_tags(id) ON DELETE CASCADE NOT NULL,
            source ticket_source NOT NULL,
            photo_url TEXT,
            time_open TIMESTAMPTZ,
            time_closed TIMESTAMPTZ,
            approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
            approved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- ==================================================
        -- STEP 8: Recreate ticket_updates table
        -- ==================================================

        CREATE TABLE public.ticket_updates (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            ticket_id TEXT REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- ==================================================
        -- STEP 9: Migrate existing data with new IDs and priority mapping
        -- ==================================================

        -- First, migrate service tags with new IDs
        INSERT INTO public.service_tags (tag, description, client_id, hardware_type, location, created_at, updated_at)
        SELECT 
            tag, 
            description, 
            client_id, 
            hardware_type, 
            location, 
            created_at, 
            updated_at
        FROM service_tags_backup
        ORDER BY created_at;

        -- Create mapping table for old to new service tag IDs
        CREATE TEMPORARY TABLE service_tag_id_mapping (
            old_id UUID,
            new_id TEXT
        );

        INSERT INTO service_tag_id_mapping (old_id, new_id)
        WITH old_tags_numbered AS (
            SELECT id as old_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
            FROM service_tags_backup
        ),
        new_tags_numbered AS (
            SELECT id as new_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
            FROM service_tags
        )
        SELECT 
            old.old_id,
            new.new_id
        FROM old_tags_numbered old
        JOIN new_tags_numbered new ON old.rn = new.rn;

        -- Migrate tickets with new IDs and priority mapping
        INSERT INTO public.tickets (
            title, 
            description, 
            status, 
            priority, 
            reported_by, 
            assigned_to, 
            service_tag_id, 
            source, 
            photo_url, 
            time_open, 
            time_closed, 
            created_at, 
            updated_at
        )
        SELECT 
            tb.title,
            tb.description,
            -- Map old status to new status (keep existing logic, but default to pending_approval for new tickets)
            CASE 
                WHEN tb.status = 'open' THEN 'open'::ticket_status_new
                WHEN tb.status = 'in_progress' THEN 'in_progress'::ticket_status_new  
                WHEN tb.status = 'resolved' THEN 'resolved'::ticket_status_new
                WHEN tb.status = 'closed' THEN 'closed'::ticket_status_new
                ELSE 'pending_approval'::ticket_status_new
            END,
            -- Map old priority to new priority (critical becomes high, keep English values)
            CASE 
                WHEN tb.priority = 'low' THEN 'low'::ticket_priority_new
                WHEN tb.priority = 'medium' THEN 'medium'::ticket_priority_new
                WHEN tb.priority = 'high' THEN 'high'::ticket_priority_new
                WHEN tb.priority = 'critical' THEN 'high'::ticket_priority_new
                ELSE 'medium'::ticket_priority_new
            END,
            tb.reported_by,
            tb.assigned_to,
            stm.new_id, -- Use mapped service tag ID
            tb.source,
            tb.photo_url,
            tb.time_open,
            tb.time_closed,
            tb.created_at,
            tb.updated_at
        FROM tickets_backup tb
        LEFT JOIN service_tag_id_mapping stm ON tb.service_tag_id = stm.old_id
        ORDER BY tb.created_at;

        -- Create mapping table for old to new ticket IDs
        CREATE TEMPORARY TABLE ticket_id_mapping (
            old_id UUID,
            new_id TEXT
        );

        INSERT INTO ticket_id_mapping (old_id, new_id)
        WITH old_tickets_numbered AS (
            SELECT id as old_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
            FROM tickets_backup
        ),
        new_tickets_numbered AS (
            SELECT id as new_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
            FROM tickets
        )
        SELECT 
            old.old_id,
            new.new_id
        FROM old_tickets_numbered old
        JOIN new_tickets_numbered new ON old.rn = new.rn;

        -- Migrate ticket updates with new ticket IDs using backup table
        INSERT INTO public.ticket_updates (ticket_id, user_id, message, created_at)
        SELECT 
            tim.new_id,
            tub.user_id,
            tub.message,
            tub.created_at
        FROM ticket_updates_backup tub
        LEFT JOIN ticket_id_mapping tim ON tub.ticket_id = tim.old_id
        WHERE tim.new_id IS NOT NULL
        ORDER BY tub.created_at;

        -- ==================================================
        -- STEP 10: Recreate indexes and constraints
        -- ==================================================

        CREATE INDEX idx_service_tags_client_id_new ON public.service_tags(client_id);
        CREATE INDEX idx_service_tags_tag_new ON public.service_tags(tag);
        CREATE INDEX idx_tickets_status_new ON public.tickets(status);
        CREATE INDEX idx_tickets_priority_new ON public.tickets(priority);
        CREATE INDEX idx_tickets_reported_by_new ON public.tickets(reported_by);
        CREATE INDEX idx_tickets_assigned_to_new ON public.tickets(assigned_to);
        CREATE INDEX idx_tickets_service_tag_id_new ON public.tickets(service_tag_id);
        CREATE INDEX idx_tickets_approved_by ON public.tickets(approved_by);
        CREATE INDEX idx_ticket_updates_ticket_id_new ON public.ticket_updates(ticket_id);
        CREATE INDEX idx_ticket_updates_user_id_new ON public.ticket_updates(user_id);

        -- ==================================================
        -- STEP 11: Recreate triggers
        -- ==================================================

        CREATE TRIGGER update_service_tags_updated_at 
            BEFORE UPDATE ON public.service_tags 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        CREATE TRIGGER update_tickets_updated_at 
            BEFORE UPDATE ON public.tickets 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        -- ==================================================
        -- STEP 12: Enable RLS and recreate policies
        -- ==================================================

        ALTER TABLE public.service_tags ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;

        -- Service tags policies (drop existing first)
        DROP POLICY IF EXISTS "service_tags_all_authenticated" ON public.service_tags;
        CREATE POLICY "service_tags_all_authenticated" ON public.service_tags
            FOR ALL USING (auth.uid() IS NOT NULL);

        -- Tickets policies (drop existing first)
        DROP POLICY IF EXISTS "tickets_all_authenticated" ON public.tickets;
        CREATE POLICY "tickets_all_authenticated" ON public.tickets
            FOR ALL USING (auth.uid() IS NOT NULL);

        -- Ticket updates policies (drop existing first)
        DROP POLICY IF EXISTS "ticket_updates_all_authenticated" ON public.ticket_updates;
        CREATE POLICY "ticket_updates_all_authenticated" ON public.ticket_updates
            FOR ALL USING (auth.uid() IS NOT NULL);

        RAISE NOTICE 'Table migration completed successfully.';
    END IF;
END $$;

-- ==================================================
-- STEP 13: Create function to approve tickets (admin only)
-- ==================================================

CREATE OR REPLACE FUNCTION approve_ticket(ticket_id_param TEXT, admin_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Check if user is admin
    SELECT role INTO user_role FROM public.users WHERE id = admin_user_id;
    
    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can approve tickets';
    END IF;
    
    -- Update ticket status and approval info
    UPDATE public.tickets 
    SET 
        status = 'open'::ticket_status,
        approved_by = admin_user_id,
        approved_at = NOW(),
        time_open = COALESCE(time_open, NOW()),
        updated_at = NOW()
    WHERE id = ticket_id_param AND status = 'pending_approval'::ticket_status;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- STEP 14: Clean up old enum types (only if they exist)
-- ==================================================

DO $$
BEGIN
    -- Drop old enum types if they exist
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority' AND typname != 'ticket_priority_new') THEN
        DROP TYPE ticket_priority CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status' AND typname != 'ticket_status_new') THEN
        DROP TYPE ticket_status CASCADE;
    END IF;
    
    -- Rename new types to original names
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority_new') THEN
        ALTER TYPE ticket_priority_new RENAME TO ticket_priority;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status_new') THEN
        ALTER TYPE ticket_status_new RENAME TO ticket_status;
    END IF;
END $$;

-- ==================================================
-- STEP 15: Final verification
-- ==================================================

DO $$
DECLARE
    ticket_count INTEGER;
    service_tag_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ticket_count FROM tickets;
    SELECT COUNT(*) INTO service_tag_count FROM service_tags;
    
    RAISE NOTICE 'Migration completed. Found % tickets and % service tags', ticket_count, service_tag_count;
    
         -- Clean up backup tables
     DROP TABLE IF EXISTS tickets_backup CASCADE;
     DROP TABLE IF EXISTS service_tags_backup CASCADE;
     DROP TABLE IF EXISTS ticket_updates_backup CASCADE;
END $$; 