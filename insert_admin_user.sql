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
    '"admin"'
)
WHERE id = '8a23ed21-2f18-4e1c-873f-6ac5d998f87a';

-- Verify the insertions
SELECT 'User created successfully!' as message;
SELECT * FROM public.users WHERE id = '8a23ed21-2f18-4e1c-873f-6ac5d998f87a';
SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = '8a23ed21-2f18-4e1c-873f-6ac5d998f87a'; 