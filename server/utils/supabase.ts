import { createClient } from '@supabase/supabase-js'

export const serverSupabase = () => {
  const config = useRuntimeConfig()

  return createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}