-- Migration: Add is_disabled field to users table
-- Date: 2025-07-15
-- Description: Adds is_disabled boolean field to users table for user status tracking

-- Add is_disabled column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE;

-- Update existing users to have is_disabled = false
UPDATE public.users SET is_disabled = FALSE WHERE is_disabled IS NULL;
