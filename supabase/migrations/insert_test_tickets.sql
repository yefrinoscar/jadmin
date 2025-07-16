-- Function to insert test tickets
DO $$
DECLARE
    v_admin_user_id UUID;
    v_client_id UUID;
    v_service_tag_id TEXT;
BEGIN
    -- Get an admin user
    SELECT id INTO v_admin_user_id
    FROM public.users
    WHERE role = 'admin'
    LIMIT 1;

    IF v_admin_user_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found. Please create an admin user first.';
    END IF;

    -- Get or create a client
    SELECT id INTO v_client_id
    FROM public.clients
    WHERE NOT is_provisional
    LIMIT 1;

    -- If no client exists, create one
    IF v_client_id IS NULL THEN
        INSERT INTO public.clients (
            name,
            email,
            phone,
            address,
            company_name,
            is_provisional
        ) VALUES (
            'Test Company',
            'contact@testcompany.com',
            '123-456-7890',
            '123 Test Street, Test City, 12345',
            'Test Company Inc.',
            FALSE
        ) RETURNING id INTO v_client_id;

        -- Create a service tag for the new client
        INSERT INTO public.service_tags (
            tag,
            description,
            client_id,
            hardware_type,
            location
        ) VALUES (
            'TEST-SERVER',
            'Main server infrastructure',
            v_client_id,
            'Server',
            'Main Office'
        ) RETURNING id INTO v_service_tag_id;
    ELSE
        -- Get existing service tag or create one
        SELECT id INTO v_service_tag_id
        FROM public.service_tags
        WHERE client_id = v_client_id
        LIMIT 1;

        IF v_service_tag_id IS NULL THEN
            INSERT INTO public.service_tags (
                tag,
                description,
                client_id,
                hardware_type,
                location
            ) VALUES (
                'TEST-SERVER',
                'Main server infrastructure',
                v_client_id,
                'Server',
                'Main Office'
            ) RETURNING id INTO v_service_tag_id;
        END IF;
    END IF;

    -- Verify we have all required IDs
    IF v_client_id IS NULL OR v_service_tag_id IS NULL THEN
        RAISE EXCEPTION 'Failed to get or create required client and service tag.';
    END IF;

    -- Insert test tickets
    INSERT INTO public.tickets (
        title,
        description,
        status,
        priority,
        reported_by,
        assigned_to,
        client_id,
        source,
        photo_url,
        time_open,
        time_closed,
        approved_by,
        approved_at,
        rejected_by,
        rejected_at,
        rejection_reason,
        needs_company_review,
        original_title,
        original_description,
        original_client_id,
        created_at,
        updated_at
    ) VALUES 
    -- Pending Approval Tickets
    (
        'Server Down - Urgent Review Needed',
        'Main production server is not responding. Immediate attention required.',
        'pending_approval',
        'high',
        v_admin_user_id,
        v_admin_user_id,
        v_client_id,
        'web',
        ARRAY['https://example.com/server-error.jpg'],
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        FALSE,
        NULL,
        NULL,
        NULL,
        NOW(),
        NOW()
    ),
    (
        'Software License Renewal',
        'Annual software license needs renewal by end of month.',
        'pending_approval',
        'medium',
        v_admin_user_id,
        v_admin_user_id,
        v_client_id,
        'email',
        ARRAY['https://example.com/license.jpg'],
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        FALSE,
        NULL,
        NULL,
        NULL,
        NOW(),
        NOW()
    ),
    -- Open Tickets
    (
        'Network Performance Issues',
        'Users reporting slow network speeds during peak hours.',
        'open',
        'medium',
        v_admin_user_id,
        v_admin_user_id,
        v_client_id,
        'phone',
        ARRAY['https://example.com/network-graph.jpg', 'https://example.com/speed-test.jpg'],
        NOW(),
        NULL,
        v_admin_user_id,
        NOW() - INTERVAL '1 hour',
        NULL,
        NULL,
        NULL,
        FALSE,
        'Network Issues',
        'Network is slow',
        v_client_id,
        NOW() - INTERVAL '2 hours',
        NOW()
    ),
    (
        'Email Configuration Problem',
        'New employee cannot send or receive emails.',
        'open',
        'high',
        v_admin_user_id,
        v_admin_user_id,
        v_client_id,
        'web',
        ARRAY['https://example.com/email-error.jpg'],
        NOW(),
        NULL,
        v_admin_user_id,
        NOW() - INTERVAL '2 hours',
        NULL,
        NULL,
        NULL,
        FALSE,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '3 hours',
        NOW()
    ),
    -- In Progress Tickets
    (
        'Backup System Failure',
        'Daily backup process failed last night. Investigating cause.',
        'in_progress',
        'high',
        v_admin_user_id,
        v_admin_user_id,
        v_client_id,
        'web',
        ARRAY['https://example.com/backup-log.jpg'],
        NOW() - INTERVAL '1 day',
        NULL,
        v_admin_user_id,
        NOW() - INTERVAL '23 hours',
        NULL,
        NULL,
        NULL,
        FALSE,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '1 day',
        NOW()
    ),
    (
        'Printer Not Working',
        'Main office printer showing offline status.',
        'in_progress',
        'low',
        v_admin_user_id,
        v_admin_user_id,
        v_client_id,
        'phone',
        ARRAY['https://example.com/printer-error.jpg'],
        NOW() - INTERVAL '2 days',
        NULL,
        v_admin_user_id,
        NOW() - INTERVAL '47 hours',
        NULL,
        NULL,
        NULL,
        FALSE,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '2 days',
        NOW()
    ),
    -- Resolved Tickets
    (
        'Password Reset Request',
        'User requested password reset for accounting software.',
        'resolved',
        'medium',
        v_admin_user_id,
        v_admin_user_id,
        v_client_id,
        'email',
        NULL,
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '2 days',
        v_admin_user_id,
        NOW() - INTERVAL '71 hours',
        NULL,
        NULL,
        NULL,
        FALSE,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        'New Software Installation',
        'Install latest version of design software.',
        'resolved',
        'low',
        v_admin_user_id,
        v_admin_user_id,
        v_client_id,
        'web',
        ARRAY['https://example.com/software-install.jpg'],
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '3 days',
        v_admin_user_id,
        NOW() - INTERVAL '95 hours',
        NULL,
        NULL,
        NULL,
        FALSE,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '3 days'
    ),
    -- Closed Tickets
    (
        'Hardware Upgrade Complete',
        'RAM upgrade completed for development team.',
        'closed',
        'medium',
        v_admin_user_id,
        v_admin_user_id,
        v_client_id,
        'web',
        ARRAY['https://example.com/ram-upgrade.jpg'],
        NOW() - INTERVAL '6 days',
        NOW() - INTERVAL '5 days',
        v_admin_user_id,
        NOW() - INTERVAL '143 hours',
        NULL,
        NULL,
        NULL,
        FALSE,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '6 days',
        NOW() - INTERVAL '5 days'
    ),
    -- Rejected Ticket
    (
        'Invalid Service Request',
        'This is a test of a rejected ticket.',
        'rejected',
        'low',
        v_admin_user_id,
        v_admin_user_id,
        v_client_id,
        'web',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        v_admin_user_id,
        NOW() - INTERVAL '1 day',
        'This request was rejected because it was a test.',
        FALSE,
        NULL,
        NULL,
        NULL,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day'
    );

    -- Link service tags to tickets
    INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
    SELECT t.id, v_service_tag_id
    FROM public.tickets t
    WHERE t.created_at >= NOW() - INTERVAL '7 days';

    -- Add detailed updates to tickets
    INSERT INTO public.ticket_updates (ticket_id, user_id, message)
    SELECT 
        t.id,
        v_admin_user_id,
        CASE 
            WHEN t.status = 'pending_approval' THEN 'Ticket created and pending review. Initial assessment required.'
            WHEN t.status = 'open' THEN 'Ticket approved and opened. Starting investigation of the reported issue.'
            WHEN t.status = 'in_progress' THEN 'Investigation complete. Working on implementing the solution.'
            WHEN t.status = 'resolved' THEN 'All issues have been resolved. Pending final verification.'
            WHEN t.status = 'rejected' THEN 'Ticket has been rejected with explanation provided.'
            ELSE 'Ticket verified and closed. All issues have been resolved successfully.'
        END
    FROM public.tickets t
    WHERE t.created_at >= NOW() - INTERVAL '7 days';

    -- Add second update for non-pending tickets
    INSERT INTO public.ticket_updates (ticket_id, user_id, message)
    SELECT 
        t.id,
        v_admin_user_id,
        CASE 
            WHEN t.status = 'open' THEN 'Initial diagnosis completed. Issue confirmed.'
            WHEN t.status = 'in_progress' THEN 'Solution identified. Implementation in progress.'
            WHEN t.status = 'resolved' THEN 'Resolution verified by team.'
            WHEN t.status = 'rejected' THEN 'Rejection notification sent to requestor.'
            WHEN t.status = 'closed' THEN 'Final verification complete. Closing ticket.'
        END
    FROM public.tickets t
    WHERE t.status != 'pending_approval' 
    AND t.created_at >= NOW() - INTERVAL '7 days';

    -- Success message
    RAISE NOTICE 'Successfully inserted test tickets with complete information!';
    RAISE NOTICE 'Using client_id: %', v_client_id;
    RAISE NOTICE 'Using service_tag_id: %', v_service_tag_id;
END $$; 