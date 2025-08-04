import { auth, currentUser, User } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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
  const cookieStore = await cookies();
  const user = await currentUser()  

  // Create Supabase client with proper cookie handling
  const supabase =  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => (await session.getToken() as string) ?? null,
      // cookies: {
      //   getAll() {
      //     return cookieStore.getAll();
      //   },
      //   setAll(cookiesToSet) {
      //     try {
      //       cookiesToSet.forEach(({ name, value, options }) =>
      //         cookieStore.set(name, value, options)
      //       );
      //     } catch {
      //       // The `setAll` method was called from a Server Component.
      //       // This can be ignored if you have middleware refreshing
      //       // user sessions.
      //     }
      //   },
      // },
    }
  );

  return createInnerTRPCContext({
    supabase,
    auth: session,
    user
  })
};




export type Context = Awaited<ReturnType<typeof createTRPCContext>> 