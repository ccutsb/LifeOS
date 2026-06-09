const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const env = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  /** true cuando .env tiene las claves de Supabase configuradas */
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
}
