// The site key for Cloudflare Turnstile, the "I'm not a robot" check on the
// Register card. It's public. Without one (e.g. locally) the widget isn't
// shown, and the server doesn't ask for a token either.
export const TURNSTILE_SITE_KEY: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''
