import { createServerClient } from '@supabase/ssr';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { cookies } from 'next/headers';
import { type User } from '@supabase/supabase-js';

export interface CreateContextOptions {
  user: User | null;
  supabase: ReturnType<typeof createServerClient<any, 'public', any>>;
}


const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    user: opts.user,
    supabase: opts.supabase,
  };
};

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const cookieStore = await cookies();
  
  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Get session from cookies
  const { data: { user } } = await supabase.auth.getUser();  

  return createInnerTRPCContext({
    user,
    supabase,
  });
};




export type Context = Awaited<ReturnType<typeof createTRPCContext>> 