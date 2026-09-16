// The "I'm not a robot" check on the Register card (Cloudflare Turnstile).
// The game sends the token the widget gave it, and Cloudflare tells us whether
// a person solved it. Registering makes accounts through the admin API, which
// skips Supabase's own sign-up limits, so this is what stops a script from
// creating thousands of accounts.

// true = a person, false = refused. Throws when Cloudflare can't be reached.
export type HumanCheck = (
  token: string,
  ip: string | undefined,
) => Promise<boolean>;

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// The check, or undefined (switched off) when no secret key is set: locally
// and in the API tests, unless the Cloudflare test keys are used.
export function turnstileCheck(
  secret: string | undefined,
  send: typeof fetch = fetch,
): HumanCheck | undefined {
  if (!secret) return undefined;
  return async (token, ip) => {
    const form = new URLSearchParams({ secret, response: token });
    if (ip) form.set("remoteip", ip);
    const res = await send(SITEVERIFY, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Turnstile answered HTTP ${res.status}`);
    const result = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (result.success !== true) {
      // e.g. timeout-or-duplicate: the token was too old or used twice.
      console.warn("Turnstile refused a token:", result["error-codes"] ?? []);
    }
    return result.success === true;
  };
}
