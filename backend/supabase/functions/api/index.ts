import "@supabase/functions-js/edge-runtime.d.ts";
import { createApp } from "./app.ts";
import { supabaseAuthProvider } from "./auth.ts";
import { ApiError } from "./errors.ts";

// Comma-separated list from the environment, e.g. "http://localhost:5173".
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function requireEnv(name: string): string {
  const value = Deno.env.get(name) ?? "";
  if (value === "") {
    throw new ApiError(
      500,
      "MISSING_ENV",
      `Server is missing required environment variable: ${name}`,
    );
  }
  return value;
}

// The actual Supabase backend. The anonymous key is fine for auth calls; the
// service role key is used to write the profile row on sign-up.
const supabaseUrl = requireEnv("SUPABASE_URL");
const anonKey = requireEnv("SUPABASE_ANON_KEY");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const app = createApp({
  allowedOrigins,
  auth: supabaseAuthProvider({
    supabaseUrl,
    anonKey,
    serviceRoleKey,
  }),
});

Deno.serve(app.fetch);