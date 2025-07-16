-- Add random service tags to tickets (ONLY from the same company)
-- This script respects the business rule that tickets can only have service tags from the same company

-- Show current state
SELECT 'Current tickets:' as info, COUNT(*) as count FROM public.tickets;
SELECT 'Current service tags:' as info, COUNT(*) as count FROM public.service_tags;
SELECT 'Current assignments:' as info, COUNT(*) as count FROM public.ticket_service_tags;

-- Add random tags to tickets - ONLY from the same company as the ticket
-- Each ticket has a 40% chance of getting each service tag from its company
INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
SELECT DISTINCT t.id, st.id
FROM public.tickets t
JOIN public.service_tags st ON t.client_id = st.client_id  -- SAME COMPANY ONLY
WHERE random() < 0.4  -- 40% chance
AND NOT EXISTS (
    SELECT 1 FROM public.ticket_service_tags tst
    WHERE tst.ticket_id = t.id AND tst.service_tag_id = st.id
);

-- Add more random tags - 25% chance for remaining combinations
INSERT INTO public.ticket_service_tags (ticket_id, service_tag_id)
SELECT DISTINCT t.id, st.id
FROM public.tickets t
JOIN public.service_tags st ON t.client_id = st.client_id  -- SAME COMPANY ONLY
WHERE random() < 0.25  -- 25% chance
AND NOT EXISTS (
    SELECT 1 FROM public.ticket_service_tags tst
    WHERE tst.ticket_id = t.id AND tst.service_tag_id = st.id
);

-- Show final results
SELECT 'Final assignments:' as info, COUNT(*) as count FROM public.ticket_service_tags;

-- Show tickets with their tags (grouped by company)
SELECT 
    c.company_name,
    t.id,
    LEFT(t.title, 30) as title,
    STRING_AGG(st.tag, ', ') as tags,
    COUNT(st.id) as tag_count
FROM public.tickets t
JOIN public.clients c ON t.client_id = c.id
LEFT JOIN public.ticket_service_tags tst ON t.id = tst.ticket_id
LEFT JOIN public.service_tags st ON tst.service_tag_id = st.id
GROUP BY c.company_name, t.id, t.title
ORDER BY c.company_name, t.id;

-- Summary by company
SELECT 
    c.company_name,
    COUNT(DISTINCT t.id) as total_tickets,
    COUNT(DISTINCT st.id) as total_service_tags,
    COUNT(tst.id) as total_assignments,
    ROUND(COUNT(tst.id)::NUMERIC / COUNT(DISTINCT t.id), 2) as avg_tags_per_ticket
FROM public.clients c
LEFT JOIN public.tickets t ON c.id = t.client_id
LEFT JOIN public.service_tags st ON c.id = st.client_id
LEFT JOIN public.ticket_service_tags tst ON t.id = tst.ticket_id
GROUP BY c.company_name
ORDER BY c.company_name; 