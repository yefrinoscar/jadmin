import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

interface CreateClientOptions {
  admin?: boolean;
  cookies?: {
    getAll: () => { name: string; value: string }[];
    setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => void;
  };
  [key: string]: any;
}

/**
 * Creates a Supabase client with optional admin privileges
 * @param options Client creation options including admin flag
 * @returns Supabase client instance
 */
export async function createClient(options?: CreateClientOptions) {
  const { admin = false, ...rest } = options ?? {};
  const cookieStore = await cookies();

  const key = admin
    ? process.env.SUPABASE_SERVICE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const auth = admin
    ? {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    : {};

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      ...rest,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth,
    },
  );
}

/**
 * Creates a Supabase admin client with service role privileges
 * @returns Supabase client with admin privileges
 */
export async function createAdminClient() {
  return createClient({ admin: true });
}
