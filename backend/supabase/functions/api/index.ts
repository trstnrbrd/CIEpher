import "@supabase/functions-js/edge-runtime.d.ts";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { handleError, handleNotFound } from "./errors.ts";

// Websites allowed to call this API from a browser, e.g. Vhan's local Vite app.
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = new Hono().basePath("/api");

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowHeaders: ["authorization", "x-client-info", "apikey", "content-type"],
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.notFound(handleNotFound);
app.onError(handleError);

Deno.serve(app.fetch);
