-- Migration: Add client_id to users table
-- Date: 2025-07-22
-- Description: Adds client_id foreign key to users table for client association

-- Add client_id column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Update RLS policies to allow users to see their client association
CREATE POLICY "Users can see their own client association" ON public.users
    FOR SELECT
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'superadmin')
        )
    );

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added client_id foreign key to users table';
END $$;
