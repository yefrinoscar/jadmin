# Supabase Database Setup

This directory contains the database migrations for the JAdmin ticket management system.

## Prerequisites

1. Install Supabase CLI: `npm install -g supabase`
2. Have a Supabase project created
3. Set up your environment variables

## Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Running Migrations

### Option 1: Using Supabase CLI (Recommended)

1. Initialize Supabase locally:
   ```bash
   supabase init
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

### Option 2: Manual SQL Execution

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of each migration file in order:
   - First: `001_initial_schema.sql`
   - Second: `002_seed_data.sql`

## Database Schema

The database includes the following tables:

### Core Tables

- **users**: User profiles extending Supabase auth.users
- **clients**: Client companies and contact information
- **service_tags**: Hardware/equipment tracking for clients
- **tickets**: Support tickets with status, priority, and assignments
- **ticket_updates**: Comments and updates on tickets

### Key Features

- **Row Level Security (RLS)**: Proper access control based on user roles
- **Automatic triggers**: 
  - Auto-update `updated_at` timestamps
  - Auto-set `time_closed` when tickets are resolved/closed
  - Auto-create user profiles on signup
- **Indexes**: Optimized for common query patterns
- **Foreign key constraints**: Data integrity enforcement

## User Roles

- **admin**: Full access to all data and operations
- **technician**: Can manage tickets, clients, and service tags
- **client**: Can view their own tickets and service tags

## Creating Your First Admin User

After running migrations, create an admin user:

1. Sign up normally through your app
2. In Supabase dashboard, go to Authentication > Users
3. Find your user and update the `raw_user_meta_data` to include:
   ```json
   {
     "role": "admin",
     "name": "Your Name"
   }
   ```
4. Delete the user from the `public.users` table
5. The trigger will recreate the profile with admin role

## Sample Data

The seed migration includes:
- 3 sample client companies
- 6 sample service tags across different hardware types
- Comments for sample tickets (uncomment after creating users)

## Security Notes

- All tables have RLS enabled
- Users can only access data based on their role and relationships
- Sensitive operations require proper authentication
- Use service role key only for admin operations

## Troubleshooting

- If you get permission errors, check your RLS policies
- Ensure your user has the correct role in the `users` table
- Check that foreign key relationships are properly set up
- Verify environment variables are correctly configured 