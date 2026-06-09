import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Si aún no hay .env configurado, usamos valores dummy para no romper la carga.
// La UI muestra una pantalla de configuración mientras env.isConfigured sea false.
export const supabase = createClient(
  env.SUPABASE_URL || 'http://localhost:54321',
  env.SUPABASE_ANON_KEY || 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'lifeos-auth',
    },
  },
)
