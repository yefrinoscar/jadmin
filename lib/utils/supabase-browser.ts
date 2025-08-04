import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/database.types'

/**
 * Creates a Supabase client for browser usage
 * @returns Supabase browser client instance
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
