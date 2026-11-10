// server/utils/supabaseAnon.ts
import { createClient } from '@supabase/supabase-js'

// A Supabase client that uses the PUBLIC (anon / publishable) key.
// Used exclusively for verifying user credentials during login.
export const serverSupabaseAnon = () => {
  const config = useRuntimeConfig()

  return createClient(
    config.public.supabaseUrl,
    config.public.supabasePublishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )
}