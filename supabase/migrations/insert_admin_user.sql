-- First, alter the user_role enum type to add 'superadmin' value
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
                  WHERE t.typname = 'user_role' AND e.enumlabel = 'superadmin') THEN
        ALTER TYPE user_role ADD VALUE 'superadmin';
    END IF;
END$$;

-- Insert admin user into public.users table
INSERT INTO public.users (
    id,
    email,
    name,
    role
) VALUES (
    '8a23ed21-2f18-4e1c-873f-6ac5d998f87a',
    'yefrioscar9814@gmail.com',
    'Oscar Yefri', -- Using a default name, you can change this
    'admin'
);

-- Update auth.users metadata to include role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"superadmin"'
)
WHERE id = '8a23ed21-2f18-4e1c-873f-6ac5d998f87a';

-- Update the user role to superadmin after adding the enum value
UPDATE public.users
SET role = 'superadmin'
WHERE id = '8a23ed21-2f18-4e1c-873f-6ac5d998f87a';

-- Verify the insertions
SELECT 'User created successfully!' as message;
SELECT * FROM public.users WHERE id = '8a23ed21-2f18-4e1c-873f-6ac5d998f87a';
SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = '8a23ed21-2f18-4e1c-873f-6ac5d998f87a';