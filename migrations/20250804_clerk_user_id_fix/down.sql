-- Migration: Revert client_id column type from TEXT back to UUID
-- Date: 2025-08-04
-- Description: Reverts the client_id column in users table back to UUID type

-- First, drop the foreign key constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_client_id_fkey;

-- Change the column type from TEXT back to UUID
ALTER TABLE public.users 
  ALTER COLUMN client_id TYPE UUID USING 
  CASE 
    WHEN client_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN client_id::UUID 
    ELSE NULL 
  END;

-- Change the primary key type in clients table from TEXT back to UUID
ALTER TABLE public.clients 
  ALTER COLUMN id TYPE UUID USING 
  CASE 
    WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN id::UUID 
    ELSE NULL 
  END;

-- Re-add the foreign key constraint with the original type
ALTER TABLE public.users 
  ADD CONSTRAINT users_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE SET NULL;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Rollback completed successfully!';
    RAISE NOTICE 'Changed client_id column type from TEXT back to UUID';
END $$;
