-- Insert sample clients
INSERT INTO public.clients (id, name, email, phone, address, company_name) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'contact@acme.com', '+1-555-0101', '123 Business St, Suite 100, Business City, BC 12345', 'Acme Corporation'),
('550e8400-e29b-41d4-a716-446655440002', 'Tech Solutions Inc', 'info@techsolutions.com', '+1-555-0102', '456 Innovation Ave, Tech Park, TP 67890', 'Tech Solutions Inc'),
('550e8400-e29b-41d4-a716-446655440003', 'Global Enterprises', 'support@globalent.com', '+1-555-0103', '789 Corporate Blvd, Enterprise City, EC 54321', 'Global Enterprises');

-- Insert sample service tags
INSERT INTO public.service_tags (id, tag, description, client_id, hardware_type, location) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'ACM-WS-001', 'Main reception workstation', '550e8400-e29b-41d4-a716-446655440001', 'Desktop Computer', 'Reception Desk'),
('660e8400-e29b-41d4-a716-446655440002', 'ACM-LAP-002', 'CEO laptop', '550e8400-e29b-41d4-a716-446655440001', 'Laptop', 'Executive Office'),
('660e8400-e29b-41d4-a716-446655440003', 'ACM-PRN-003', 'Main office printer', '550e8400-e29b-41d4-a716-446655440001', 'Printer', 'Office Floor 1'),
('660e8400-e29b-41d4-a716-446655440004', 'TS-SRV-001', 'Main server', '550e8400-e29b-41d4-a716-446655440002', 'Server', 'Server Room'),
('660e8400-e29b-41d4-a716-446655440005', 'TS-NET-002', 'Network switch', '550e8400-e29b-41d4-a716-446655440002', 'Network Equipment', 'Server Room'),
('660e8400-e29b-41d4-a716-446655440006', 'GE-TAB-001', 'Sales team tablet', '550e8400-e29b-41d4-a716-446655440003', 'Tablet', 'Sales Department');

-- Note: User data will be created automatically when users sign up via auth
-- But you can manually insert test users if needed for development
-- Remember to also create corresponding auth.users entries for these to work

-- Sample tickets (these would need actual user IDs from auth.users)
-- INSERT INTO public.tickets (title, description, priority, reported_by, service_tag_id, source) VALUES
-- ('Printer not working', 'The main office printer is showing error code 503 and not printing documents', 'high', 'user-uuid-here', '660e8400-e29b-41d4-a716-446655440003', 'phone'),
-- ('Laptop slow performance', 'CEO laptop is running very slowly, taking long time to boot up', 'medium', 'user-uuid-here', '660e8400-e29b-41d4-a716-446655440002', 'email'),
-- ('Network connectivity issues', 'Unable to connect to internal network from reception workstation', 'high', 'user-uuid-here', '660e8400-e29b-41d4-a716-446655440001', 'in_person');

-- You can uncomment and modify the above after creating actual users 