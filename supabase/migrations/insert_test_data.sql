-- Insert test data for tickets system
-- This script will create test clients, service tags, and tickets

-- First, ensure we have an admin user
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Get or create admin user
    SELECT id INTO v_admin_id
    FROM public.users
    WHERE role = 'admin'
    LIMIT 1;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found. Please create an admin user first.';
    END IF;

    -- Create test clients
    INSERT INTO public.clients (name, email, phone, address, company_name)
    VALUES
        ('John Tech Corp', 'contact@johntechcorp.com', '+1234567890', '123 Tech Street, Silicon Valley', 'John Tech Corporation'),
        ('Smith Manufacturing', 'info@smithmanuf.com', '+1987654321', '456 Industry Ave, Detroit', 'Smith Manufacturing Inc.'),
        ('Global Solutions', 'support@globalsolutions.com', '+1122334455', '789 Global Road, New York', 'Global IT Solutions'),
        ('Local Services', 'help@localservices.net', '+1555666777', '321 Local Street, Chicago', 'Local IT Services')
    ON CONFLICT (email) DO NOTHING;

    -- Create service tags for each client
    -- John Tech Corporation
    WITH client AS (
        SELECT id FROM public.clients WHERE company_name = 'John Tech Corporation' LIMIT 1
    )
    INSERT INTO public.service_tags (tag, description, client_id, hardware_type, location)
    SELECT tag, description, client.id, hardware_type, location
    FROM client,
    (VALUES
        ('JTC-SERVER-01', 'Main Production Server', 'Server', 'Server Room A'),
        ('JTC-NETWORK-01', 'Primary Network Infrastructure', 'Network', 'Main Office'),
        ('JTC-PRINTER-01', 'Executive Floor Printer', 'Printer', 'Floor 5'),
        ('JTC-WORKSTATION-01', 'Development Team Workstations', 'Workstation', 'Floor 3')
    ) AS tags(tag, description, hardware_type, location);

    -- Smith Manufacturing
    WITH client AS (
        SELECT id FROM public.clients WHERE company_name = 'Smith Manufacturing Inc.' LIMIT 1
    )
    INSERT INTO public.service_tags (tag, description, client_id, hardware_type, location)
    SELECT tag, description, client.id, hardware_type, location
    FROM client,
    (VALUES
        ('SM-INDUSTRIAL-01', 'Manufacturing Control System', 'Industrial PC', 'Factory Floor'),
        ('SM-NETWORK-01', 'Factory Network', 'Network', 'Main Factory'),
        ('SM-SERVER-01', 'Production Data Server', 'Server', 'Control Room'),
        ('SM-SECURITY-01', 'Security System', 'Security System', 'Entire Facility')
    ) AS tags(tag, description, hardware_type, location);

    -- Global IT Solutions
    WITH client AS (
        SELECT id FROM public.clients WHERE company_name = 'Global IT Solutions' LIMIT 1
    )
    INSERT INTO public.service_tags (tag, description, client_id, hardware_type, location)
    SELECT tag, description, client.id, hardware_type, location
    FROM client,
    (VALUES
        ('GS-CLOUD-01', 'Cloud Infrastructure', 'Cloud Server', 'AWS East'),
        ('GS-DB-01', 'Primary Database Cluster', 'Database', 'Data Center 1'),
        ('GS-BACKUP-01', 'Backup System', 'Backup System', 'Data Center 2'),
        ('GS-MONITORING-01', 'System Monitoring Setup', 'Monitoring', 'All Locations')
    ) AS tags(tag, description, hardware_type, location);

    -- Local IT Services
    WITH client AS (
        SELECT id FROM public.clients WHERE company_name = 'Local IT Services' LIMIT 1
    )
    INSERT INTO public.service_tags (tag, description, client_id, hardware_type, location)
    SELECT tag, description, client.id, hardware_type, location
    FROM client,
    (VALUES
        ('LIT-HELPDESK-01', 'Helpdesk System', 'Support System', 'Main Office'),
        ('LIT-NETWORK-01', 'Office Network', 'Network', 'All Floors'),
        ('LIT-VOIP-01', 'VoIP Phone System', 'VoIP', 'All Floors'),
        ('LIT-STORAGE-01', 'Network Storage', 'NAS', 'Server Room')
    ) AS tags(tag, description, hardware_type, location);

    -- Create tickets with various statuses and service tags
    -- Function to create a ticket with service tags
    CREATE OR REPLACE FUNCTION create_test_ticket(
        p_title TEXT,
        p_description TEXT,
        p_status ticket_status,
        p_priority ticket_priority,
        p_client_name TEXT,
        p_service_tags TEXT[],
        p_source ticket_source DEFAULT 'web'
    ) RETURNS TEXT AS $$
    DECLARE
        v_client_id UUID;
        v_ticket_id TEXT;
        v_tag_id TEXT;
    BEGIN
        -- Get client ID
        SELECT id INTO v_client_id
        FROM public.clients
        WHERE company_name = p_client_name;

        -- Create ticket
        INSERT INTO public.tickets (
            title,
            description,
            status,
            priority,
            client_id,
            source,
            reported_by,
            assigned_to,
            approved_by,
            approved_at,
            time_open
        )
        VALUES (
            p_title,
            p_description,
            p_status,
            p_priority,
            v_client_id,
            p_source,
            v_admin_id,
            v_admin_id,
            CASE WHEN p_status != 'pending_approval' THEN v_admin_id ELSE NULL END,
            CASE WHEN p_status != 'pending_approval' THEN NOW() ELSE NULL END,
            CASE WHEN p_status NOT IN ('pending_approval', 'rejected') THEN NOW() ELSE NULL END
        )
        RETURNING id INTO v_ticket_id;

        -- Add service tags
        FOREACH v_tag_id IN ARRAY (
            SELECT id FROM public.service_tags
            WHERE client_id = v_client_id
            AND tag = ANY(p_service_tags)
        )
        LOOP
            INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
            VALUES (v_ticket_id, v_tag_id);
        END LOOP;

        RETURN v_ticket_id;
    END;
    $$ LANGUAGE plpgsql;

    -- Create various tickets
    PERFORM create_test_ticket(
        'Server Performance Issues',
        'Main production server showing high CPU usage and slow response times',
        'open',
        'high',
        'John Tech Corporation',
        ARRAY['JTC-SERVER-01', 'JTC-NETWORK-01']
    );

    PERFORM create_test_ticket(
        'Printer Configuration',
        'New printer needs to be configured for executive floor',
        'in_progress',
        'medium',
        'John Tech Corporation',
        ARRAY['JTC-PRINTER-01']
    );

    PERFORM create_test_ticket(
        'Manufacturing System Error',
        'Control system showing intermittent errors during production',
        'open',
        'high',
        'Smith Manufacturing Inc.',
        ARRAY['SM-INDUSTRIAL-01', 'SM-NETWORK-01']
    );

    PERFORM create_test_ticket(
        'Security System Upgrade',
        'Scheduled security system upgrade and maintenance',
        'pending_approval',
        'medium',
        'Smith Manufacturing Inc.',
        ARRAY['SM-SECURITY-01']
    );

    PERFORM create_test_ticket(
        'Cloud Infrastructure Optimization',
        'Need to optimize cloud resources for better cost efficiency',
        'in_progress',
        'medium',
        'Global IT Solutions',
        ARRAY['GS-CLOUD-01', 'GS-MONITORING-01']
    );

    PERFORM create_test_ticket(
        'Database Backup Failure',
        'Last night''s database backup failed to complete',
        'resolved',
        'high',
        'Global IT Solutions',
        ARRAY['GS-DB-01', 'GS-BACKUP-01']
    );

    PERFORM create_test_ticket(
        'VoIP Quality Issues',
        'Users reporting poor call quality and dropped calls',
        'open',
        'high',
        'Local IT Services',
        ARRAY['LIT-VOIP-01', 'LIT-NETWORK-01']
    );

    PERFORM create_test_ticket(
        'Storage System Expansion',
        'Need to expand storage capacity for growing data needs',
        'pending_approval',
        'low',
        'Local IT Services',
        ARRAY['LIT-STORAGE-01']
    );

    -- Add some ticket updates
    INSERT INTO public.ticket_updates (ticket_id, user_id, message)
    SELECT 
        t.id,
        v_admin_id,
        CASE t.status
            WHEN 'in_progress' THEN 'Started working on the issue. Initial assessment completed.'
            WHEN 'resolved' THEN 'Issue has been resolved. Closing ticket after final checks.'
            WHEN 'open' THEN 'Ticket opened and under review.'
            ELSE 'Ticket created and awaiting processing.'
        END
    FROM public.tickets t;

    -- Drop the temporary function
    DROP FUNCTION IF EXISTS create_test_ticket;

    RAISE NOTICE 'Test data inserted successfully!';
END $$; 