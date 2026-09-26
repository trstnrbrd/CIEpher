import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The browser's Supabase client. It only uses the public (publishable) key,
// which is safe to ship. supabase-js keeps the player's session saved in the
// browser and refreshes it automatically.
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Set when the client can't be built. Kept as data instead of a module-scope
// throw so a missing key renders a readable screen instead of a blank page.
export const configError: string | null =
  !url || !publishableKey
    ? 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy frontend/.env.example to frontend/.env.local.'
    : null

// A password reset email opens the game with "#...type=recovery..." in the
// address, or with an error code if the link has expired or was already used.
// Read it before supabase-js below turns the link into a session.
const linkParams = new URLSearchParams(window.location.hash.slice(1))
export const resetLink: 'valid' | 'expired' | null =
  linkParams.get('type') === 'recovery'
    ? 'valid'
    : linkParams.has('error_code')
      ? 'expired'
      : null

export const supabase: SupabaseClient | null =
  url && publishableKey ? createClient(url, publishableKey) : null
