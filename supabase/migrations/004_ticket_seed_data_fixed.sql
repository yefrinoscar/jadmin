-- Seed data for tickets using real authenticated user
-- Using existing user ID: f9f9cbcb-d06b-4a5e-8112-0be7c51238bb

-- First, ensure the user exists in our users table
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
VALUES (
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb',
    'yefrioscar9814@gmail.com',
    'Admin User',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Insert sample tickets using the real user ID
INSERT INTO public.tickets (
    id, 
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
) VALUES

-- Open tickets
(
    '10000000-0000-0000-0000-000000000001',
    'Printer not responding to print jobs',
    'The main office printer (ACM-PRN-003) stopped responding to print jobs this morning. Users are getting error messages when trying to print documents. The printer display shows "Ready" but nothing prints.',
    'open',
    'high',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Real user
    NULL, -- unassigned for now
    '660e8400-e29b-41d4-a716-446655440003', -- ACM-PRN-003
    'phone',
    NULL,
    NOW() - INTERVAL '2 hours',
    NULL,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
),

(
    '10000000-0000-0000-0000-000000000002',
    'Laptop extremely slow boot time',
    'CEO laptop takes over 10 minutes to boot up and applications are very slow to load. This started yesterday after the last Windows update.',
    'open',
    'critical',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Real user
    NULL, -- unassigned
    '660e8400-e29b-41d4-a716-446655440002', -- ACM-LAP-002
    'email',
    NULL,
    NOW() - INTERVAL '1 day',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),

-- In progress tickets
(
    '10000000-0000-0000-0000-000000000003',
    'Network connectivity issues in reception',
    'Reception workstation cannot connect to the internal network. Internet works fine but cannot access shared drives or internal applications.',
    'in_progress',
    'high',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Real user
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Self-assigned for demo
    '660e8400-e29b-41d4-a716-446655440001', -- ACM-WS-001
    'in_person',
    NULL,
    NOW() - INTERVAL '6 hours',
    NULL,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '1 hour'
),

(
    '10000000-0000-0000-0000-000000000004',
    'Server performance degradation',
    'Main server experiencing significant performance issues. Response times are 3x slower than normal. Database queries taking much longer to execute.',
    'in_progress',
    'critical',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Real user
    NULL, -- unassigned
    '660e8400-e29b-41d4-a716-446655440004', -- TS-SRV-001
    'email',
    NULL,
    NOW() - INTERVAL '4 hours',
    NULL,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '30 minutes'
),

-- Resolved tickets
(
    '10000000-0000-0000-0000-000000000005',
    'Network switch showing error lights',
    'Network switch in server room has amber status lights. Some devices losing connectivity intermittently.',
    'resolved',
    'medium',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Real user
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Self-assigned for demo
    '660e8400-e29b-41d4-a716-446655440005', -- TS-NET-002
    'phone',
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
),

-- Closed tickets
(
    '10000000-0000-0000-0000-000000000006',
    'Tablet screen not responding to touch',
    'Sales team tablet screen not responding to touch input. Physical damage visible on screen corner.',
    'closed',
    'low',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Real user
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Self-assigned for demo
    '660e8400-e29b-41d4-a716-446655440006', -- GE-TAB-001
    'web',
    'https://example.com/tablet-damage.jpg',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '3 days'
),

(
    '10000000-0000-0000-0000-000000000007',
    'Email server configuration issue',
    'Users unable to send emails. Receiving works fine but outgoing mail stuck in outbox. SMTP configuration may need updating.',
    'closed',
    'medium',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Real user
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Self-assigned for demo
    '660e8400-e29b-41d4-a716-446655440004', -- TS-SRV-001
    'email',
    NULL,
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '5 days'
),

-- Recent tickets
(
    '10000000-0000-0000-0000-000000000008',
    'WiFi password not working for guest network',
    'Visitors cannot connect to guest WiFi network. Password appears to be incorrect or expired.',
    'open',
    'low',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', -- Real user
    NULL, -- unassigned
    '660e8400-e29b-41d4-a716-446655440005', -- TS-NET-002 (for network-related issue)
    'in_person',
    NULL,
    NOW() - INTERVAL '30 minutes',
    NULL,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
),

-- Additional variety tickets
(
    '10000000-0000-0000-0000-000000000009',
    'Software license expired notification',
    'Receiving notifications that Microsoft Office license will expire in 7 days. Need to renew enterprise license.',
    'open',
    'medium',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb',
    NULL,
    '660e8400-e29b-41d4-a716-446655440002', -- ACM-LAP-002
    'email',
    NULL,
    NOW() - INTERVAL '3 hours',
    NULL,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
),

(
    '10000000-0000-0000-0000-000000000010',
    'Monitor flickering issue',
    'External monitor connected to workstation shows flickering and occasional black screen. Issue started after power outage yesterday.',
    'in_progress',
    'low',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb',
    'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb',
    '660e8400-e29b-41d4-a716-446655440001', -- ACM-WS-001
    'phone',
    NULL,
    NOW() - INTERVAL '8 hours',
    NULL,
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '2 hours'
);

-- Insert ticket updates using real user
INSERT INTO public.ticket_updates (id, ticket_id, user_id, message, created_at) VALUES

-- Updates for printer ticket
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'I have received the ticket and will investigate the printer issue. Will check the printer queue and driver status.', NOW() - INTERVAL '1 hour 45 minutes'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'Found that the printer spooler service was stopped. Restarting the service now and testing print functionality.', NOW() - INTERVAL '1 hour 30 minutes'),

-- Updates for network connectivity
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'Arrived on-site and confirmed the network connectivity issue. Testing cable connections and switch ports.', NOW() - INTERVAL '5 hours'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'Found a loose network cable connection. Secured the cable and testing connectivity now.', NOW() - INTERVAL '4 hours 30 minutes'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'Network access is working much better now. Connection is stable.', NOW() - INTERVAL '4 hours'),

-- Updates for server performance
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'Investigating server performance. Checking CPU, memory usage, and disk I/O metrics.', NOW() - INTERVAL '3 hours 30 minutes'),
('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'Identified high memory usage from a runaway process. Terminating the process and monitoring system performance.', NOW() - INTERVAL '2 hours'),

-- Updates for resolved network switch
('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'Investigated the network switch. Found that the firmware needed updating. Applied latest firmware update.', NOW() - INTERVAL '1 day 12 hours'),
('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000005', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'Network switch is now running stable. All status lights are green and connectivity issues resolved.', NOW() - INTERVAL '1 day'),

-- Updates for closed tablet ticket
('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000006', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'Examined the tablet. Screen damage is extensive and requires replacement. Provided quote for screen replacement.', NOW() - INTERVAL '4 days'),
('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000006', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'New tablet has been ordered and configured. Delivered to sales team. Ticket closed.', NOW() - INTERVAL '3 days'),

-- Updates for monitor issue
('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000010', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'Tested monitor with different cable and port. Issue seems to be with the display cable. Replacing cable now.', NOW() - INTERVAL '6 hours'),
('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000010', 'f9f9cbcb-d06b-4a5e-8112-0be7c51238bb', 'New display cable installed. Monitor is working properly now, no more flickering.', NOW() - INTERVAL '2 hours');

-- Success message
SELECT 'Ticket seed data has been successfully inserted!' as message,
       COUNT(*) as tickets_created
FROM public.tickets 
WHERE id::text LIKE '10000000-0000-0000-0000-%'; 