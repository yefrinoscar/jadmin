import { auth, currentUser, User } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export interface CreateContextOptions {
  supabase: ReturnType<typeof createClient<any, 'public', any>>;
  auth: Awaited<ReturnType<typeof auth>>
  user: User | null
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    supabase: opts.supabase,
    auth: opts.auth,
    user: opts.user
  };
};

export const createTRPCContext = async () => {
  const session = await auth()
  const user = await currentUser()

  // Create Supabase client with proper cookie handling
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      /* global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await session.getToken();
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${clerkToken}`);
          return fetch(url, { ...options, headers });
        }
      }, */
      accessToken: async () => (await session.getToken()) ?? null
      
      /* global: {
        headers: {
          Authorization: `Bearer ${session.getToken()}`
        },
      }, */
    }
  );

  return createInnerTRPCContext({
    supabase,
    auth: session,
    user
  })
};




export type Context = Awaited<ReturnType<typeof createTRPCContext>> 