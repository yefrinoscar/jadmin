-- Add Hardware Service Tags to Companies
-- This script adds various hardware assets as service tags for each company

-- Show current state
SELECT 'Current clients:' as info, COUNT(*) as count FROM public.clients;
SELECT 'Current service tags:' as info, COUNT(*) as count FROM public.service_tags;

-- ========================================
-- Add Service Tags for Each Company
-- ========================================

-- Get the client IDs for reference
DO $$
DECLARE
    acme_id UUID;
    tech_solutions_id UUID;
    global_enterprises_id UUID;
BEGIN
    -- Get client IDs
    SELECT id INTO acme_id FROM public.clients WHERE company_name = 'Acme Corporation' LIMIT 1;
    SELECT id INTO tech_solutions_id FROM public.clients WHERE company_name = 'Tech Solutions Inc' LIMIT 1;
    SELECT id INTO global_enterprises_id FROM public.clients WHERE company_name = 'Global Enterprises' LIMIT 1;

    -- ========================================
    -- ACME CORPORATION HARDWARE
    -- ========================================
    
    -- Office Computers
    INSERT INTO public.service_tags (tag, description, client_id, hardware_type, location) VALUES
    ('ACM-LAP-001', 'CEO Executive Laptop - Dell XPS 15', acme_id, 'Laptop', 'Executive Office'),
    ('ACM-LAP-002', 'HR Manager Laptop - ThinkPad T14', acme_id, 'Laptop', 'HR Department'),
    ('ACM-LAP-003', 'Sales Director Laptop - MacBook Pro 16"', acme_id, 'Laptop', 'Sales Department'),
    ('ACM-WS-001', 'Reception Workstation - Dell OptiPlex', acme_id, 'Desktop Computer', 'Reception Desk'),
    ('ACM-WS-002', 'Accounting Workstation 1 - HP EliteDesk', acme_id, 'Desktop Computer', 'Accounting Department'),
    ('ACM-WS-003', 'Accounting Workstation 2 - HP EliteDesk', acme_id, 'Desktop Computer', 'Accounting Department'),
    
    -- Printers and Office Equipment
    ('ACM-PRN-001', 'Main Office Printer - HP LaserJet Pro', acme_id, 'Printer', 'Main Office Floor 1'),
    ('ACM-PRN-002', 'Color Printer Sales - Canon ImageClass', acme_id, 'Printer', 'Sales Department'),
    ('ACM-PRN-003', 'Executive Printer - HP OfficeJet Pro', acme_id, 'Printer', 'Executive Floor'),
    ('ACM-SCN-001', 'Document Scanner - Fujitsu ScanSnap', acme_id, 'Scanner', 'Administration'),
    
    -- Network Equipment
    ('ACM-RTR-001', 'Main Router - Cisco RV340W', acme_id, 'Network Equipment', 'IT Closet Floor 1'),
    ('ACM-SW-001', 'Main Switch 24-port - Netgear GS724T', acme_id, 'Network Equipment', 'IT Closet Floor 1'),
    ('ACM-AP-001', 'WiFi Access Point Floor 1 - Ubiquiti UniFi', acme_id, 'Network Equipment', 'Main Office Ceiling'),
    ('ACM-AP-002', 'WiFi Access Point Floor 2 - Ubiquiti UniFi', acme_id, 'Network Equipment', 'Executive Floor Ceiling')
    ON CONFLICT (tag) DO NOTHING;

    -- ========================================
    -- TECH SOLUTIONS INC HARDWARE
    -- ========================================
    
    -- Development Equipment
    INSERT INTO public.service_tags (tag, description, client_id, hardware_type, location) VALUES
    ('TS-WS-001', 'Developer Workstation 1 - High-end Custom PC', tech_solutions_id, 'Desktop Computer', 'Development Room'),
    ('TS-WS-002', 'Developer Workstation 2 - High-end Custom PC', tech_solutions_id, 'Desktop Computer', 'Development Room'),
    ('TS-WS-003', 'Developer Workstation 3 - High-end Custom PC', tech_solutions_id, 'Desktop Computer', 'Development Room'),
    ('TS-LAP-001', 'CTO Laptop - MacBook Pro M2 Max', tech_solutions_id, 'Laptop', 'CTO Office'),
    ('TS-LAP-002', 'Lead Developer Laptop - ThinkPad P1', tech_solutions_id, 'Laptop', 'Development Room'),
    ('TS-LAP-003', 'QA Tester Laptop - Dell Precision 5570', tech_solutions_id, 'Laptop', 'QA Department'),
    
    -- Servers and Infrastructure
    ('TS-SRV-001', 'Main Application Server - Dell PowerEdge R740', tech_solutions_id, 'Server', 'Server Room'),
    ('TS-SRV-002', 'Database Server - HP ProLiant DL380', tech_solutions_id, 'Server', 'Server Room'),
    ('TS-SRV-003', 'Backup Server - Synology RS3621xs+', tech_solutions_id, 'Server', 'Server Room'),
    ('TS-NAS-001', 'Network Storage - QNAP TS-464C2', tech_solutions_id, 'Storage Device', 'Server Room'),
    
    -- Network Infrastructure
    ('TS-RTR-001', 'Enterprise Router - Cisco ISR 4331', tech_solutions_id, 'Network Equipment', 'Server Room'),
    ('TS-SW-001', 'Core Switch 48-port - Cisco Catalyst 2960X', tech_solutions_id, 'Network Equipment', 'Server Room'),
    ('TS-FW-001', 'Firewall - SonicWall TZ670', tech_solutions_id, 'Network Equipment', 'Server Room'),
    ('TS-UPS-001', 'UPS Battery Backup - APC Smart-UPS 3000VA', tech_solutions_id, 'UPS', 'Server Room')
    ON CONFLICT (tag) DO NOTHING;

    -- ========================================
    -- GLOBAL ENTERPRISES HARDWARE
    -- ========================================
    
    -- Executive Equipment
    INSERT INTO public.service_tags (tag, description, client_id, hardware_type, location) VALUES
    ('GE-LAP-001', 'President Laptop - Surface Laptop Studio', global_enterprises_id, 'Laptop', 'President Office'),
    ('GE-LAP-002', 'VP Sales Laptop - MacBook Air M2', global_enterprises_id, 'Laptop', 'VP Sales Office'),
    ('GE-LAP-003', 'VP Operations Laptop - ThinkPad X1 Carbon', global_enterprises_id, 'Laptop', 'VP Operations Office'),
    ('GE-TAB-001', 'Sales Team Tablet 1 - iPad Pro 12.9"', global_enterprises_id, 'Tablet', 'Sales Department'),
    ('GE-TAB-002', 'Sales Team Tablet 2 - iPad Pro 12.9"', global_enterprises_id, 'Tablet', 'Sales Department'),
    ('GE-TAB-003', 'Sales Team Tablet 3 - Surface Pro 9', global_enterprises_id, 'Tablet', 'Sales Department'),
    
    -- Office Equipment
    ('GE-WS-001', 'Reception Computer - HP EliteOne 800', global_enterprises_id, 'Desktop Computer', 'Main Reception'),
    ('GE-WS-002', 'Conference Room PC - Intel NUC', global_enterprises_id, 'Desktop Computer', 'Conference Room A'),
    ('GE-PRN-001', 'Multi-function Printer - Xerox VersaLink B605', global_enterprises_id, 'Printer', 'Central Office'),
    ('GE-PRN-002', 'Executive Color Printer - Canon imageRUNNER', global_enterprises_id, 'Printer', 'Executive Floor'),
    ('GE-PROJ-001', 'Conference Room Projector - Epson PowerLite', global_enterprises_id, 'Projector', 'Conference Room A'),
    ('GE-PROJ-002', 'Training Room Projector - BenQ MH535FHD', global_enterprises_id, 'Projector', 'Training Room'),
    
    -- Communication Equipment
    ('GE-PHONE-001', 'VoIP Phone System Base - Grandstream UCM6300', global_enterprises_id, 'Phone System', 'IT Room'),
    ('GE-CAMERA-001', 'Security Camera System - Hikvision NVR', global_enterprises_id, 'Security Equipment', 'Security Office'),
    ('GE-RTR-001', 'Main Internet Router - ASUS AX6000', global_enterprises_id, 'Network Equipment', 'IT Room'),
    ('GE-SW-001', 'Managed Switch - TP-Link TL-SG3428', global_enterprises_id, 'Network Equipment', 'IT Room')
    ON CONFLICT (tag) DO NOTHING;

    RAISE NOTICE 'Added service tags for all companies successfully!';
END $$;

-- Show final results
SELECT 'Final service tags:' as info, COUNT(*) as count FROM public.service_tags;

-- Show service tags by company
SELECT 
    c.company_name,
    COUNT(st.id) as total_hardware,
    STRING_AGG(DISTINCT st.hardware_type, ', ') as hardware_types
FROM public.clients c
LEFT JOIN public.service_tags st ON c.id = st.client_id
GROUP BY c.company_name
ORDER BY c.company_name;

-- Show detailed hardware inventory by company
SELECT 
    c.company_name,
    st.hardware_type,
    COUNT(*) as quantity,
    STRING_AGG(st.tag, ', ') as service_tags
FROM public.clients c
JOIN public.service_tags st ON c.id = st.client_id
GROUP BY c.company_name, st.hardware_type
ORDER BY c.company_name, st.hardware_type;

-- Show all service tags with details
SELECT 
    c.company_name,
    st.tag,
    st.hardware_type,
    st.description,
    st.location
FROM public.clients c
JOIN public.service_tags st ON c.id = st.client_id
ORDER BY c.company_name, st.hardware_type, st.tag; 