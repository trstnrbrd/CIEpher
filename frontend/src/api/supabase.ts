import { createClient } from '@supabase/supabase-js'

// The browser's Supabase client. It only uses the public (publishable) key,
// which is safe to ship. supabase-js keeps the player's session saved in the
// browser and refreshes it automatically.
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy frontend/.env.example to frontend/.env.local.',
  )
}

export const supabase = createClient(url, publishableKey)
