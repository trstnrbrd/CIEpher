import "@supabase/functions-js/edge-runtime.d.ts";
import { createApp } from "./app.ts";

// Comma-separated list from the environment, e.g. "http://localhost:5173".
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

Deno.serve(createApp({ allowedOrigins }).fetch);
