-- Migration: Ticket Comments with Photo Support
-- Date: 2025-07-17
-- Description: Adds ticket comments functionality with photo attachments and history tracking

-- Create ticket_comments table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id TEXT REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    photo_urls TEXT[] DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries by ticket_id
CREATE INDEX IF NOT EXISTS ticket_comments_ticket_id_idx ON public.ticket_comments(ticket_id);

-- Add trigger to update updated_at column
CREATE TRIGGER update_ticket_comments_updated_at
    BEFORE UPDATE ON public.ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to add a comment to a ticket and record in history
CREATE OR REPLACE FUNCTION add_ticket_comment(
    p_ticket_id TEXT,
    p_user_id UUID,
    p_content TEXT,
    p_photo_urls TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_comment_id UUID;
    v_user_name TEXT;
BEGIN
    -- Validate ticket exists
    IF NOT EXISTS (SELECT 1 FROM public.tickets WHERE id = p_ticket_id) THEN
        RAISE EXCEPTION 'Ticket with ID % does not exist', p_ticket_id;
    END IF;
    
    -- Validate user exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
    END IF;
    
    -- Get user name for history
    SELECT name INTO v_user_name FROM public.users WHERE id = p_user_id;
    
    -- Insert comment
    INSERT INTO public.ticket_comments (
        ticket_id,
        user_id,
        content,
        photo_urls
    ) VALUES (
        p_ticket_id,
        p_user_id,
        p_content,
        p_photo_urls
    ) RETURNING id INTO v_comment_id;
    
    -- Add to ticket history
    INSERT INTO public.ticket_updates (
        ticket_id,
        user_id,
        message
    ) VALUES (
        p_ticket_id,
        p_user_id,
        'Comment added: ' || p_content
    );
    
    RETURN v_comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to soft-delete a comment and record in history
CREATE OR REPLACE FUNCTION delete_ticket_comment(
    p_comment_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_ticket_id TEXT;
    v_comment_content TEXT;
    v_user_name TEXT;
BEGIN
    -- Validate comment exists
    IF NOT EXISTS (SELECT 1 FROM public.ticket_comments WHERE id = p_comment_id AND NOT is_deleted) THEN
        RAISE EXCEPTION 'Comment with ID % does not exist or is already deleted', p_comment_id;
    END IF;
    
    -- Validate user exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
    END IF;
    
    -- Get user name for history
    SELECT name INTO v_user_name FROM public.users WHERE id = p_user_id;
    
    -- Get ticket_id and content for history
    SELECT ticket_id, content INTO v_ticket_id, v_comment_content 
    FROM public.ticket_comments 
    WHERE id = p_comment_id;
    
    -- Soft delete the comment
    UPDATE public.ticket_comments
    SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = p_user_id
    WHERE id = p_comment_id;
    
    -- Add to ticket history
    INSERT INTO public.ticket_updates (
        ticket_id,
        user_id,
        message
    ) VALUES (
        v_ticket_id,
        p_user_id,
        'Comment deleted: ' || v_comment_content
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for ticket comments
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Admins and technicians can view all comments
CREATE POLICY "Admins and technicians can view all comments" ON public.ticket_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'technician')
        )
    );

-- Clients can only view comments for their tickets
CREATE POLICY "Clients can view comments for their tickets" ON public.ticket_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            JOIN public.clients c ON t.client_id = c.id
            JOIN public.users u ON u.id = auth.uid()
            WHERE t.id = ticket_comments.ticket_id
            AND u.role = 'client'
            AND EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
            )
        )
    );

-- Admins and technicians can insert comments
CREATE POLICY "Admins and technicians can insert comments" ON public.ticket_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'technician')
        )
    );

-- Clients can insert comments for their tickets
CREATE POLICY "Clients can insert comments for their tickets" ON public.ticket_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets t
            JOIN public.clients c ON t.client_id = c.id
            JOIN public.users u ON u.id = auth.uid()
            WHERE t.id = ticket_comments.ticket_id
            AND u.role = 'client'
            AND EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
            )
        )
    );

-- Only admins and the comment author can update comments
CREATE POLICY "Admins and comment authors can update comments" ON public.ticket_comments
    FOR UPDATE
    USING (
        (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role = 'admin'
            )
        ) OR (
            ticket_comments.user_id = auth.uid()
        )
    );

-- Create a view for active comments (not deleted)
CREATE OR REPLACE VIEW active_ticket_comments AS
SELECT
    c.id,
    c.ticket_id,
    c.user_id,
    u.name as user_name,
    u.role as user_role,
    c.content,
    c.photo_urls,
    c.created_at,
    c.updated_at
FROM
    public.ticket_comments c
JOIN
    public.users u ON c.user_id = u.id
WHERE
    NOT c.is_deleted
ORDER BY
    c.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.ticket_comments TO authenticated;
GRANT INSERT ON public.ticket_comments TO authenticated;
GRANT UPDATE (is_deleted, deleted_at, deleted_by) ON public.ticket_comments TO authenticated;
GRANT SELECT ON public.active_ticket_comments TO authenticated;
