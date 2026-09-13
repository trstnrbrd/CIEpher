import "@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAccounts } from "./accounts.ts";
import { createApp } from "./app.ts";
import { supabaseGame } from "./game.ts";
import { sentryReporter } from "./sentry.ts";

// Comma-separated list from the environment, e.g. "http://localhost:5173".
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Supabase gives every function these settings automatically.
const supabase = {
  url: requireEnv("SUPABASE_URL"),
  anonKey: requireEnv("SUPABASE_ANON_KEY"),
  serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
};

Deno.serve(
  createApp({
    allowedOrigins,
    accounts: supabaseAccounts(supabase),
    game: supabaseGame(supabase),
    // Set only on staging and production (Supabase secrets).
    reportError: sentryReporter(
      Deno.env.get("SENTRY_DSN"),
      Deno.env.get("SENTRY_ENVIRONMENT") ?? "unknown",
    ),
  }).fetch,
);

// Stop at startup if a setting is missing, instead of failing on a player's request.
function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}
