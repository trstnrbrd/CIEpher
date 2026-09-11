import "@supabase/functions-js/edge-runtime.d.ts";
import { Hono } from "hono";

const app = new Hono().basePath("/api");

app.get("/health", (c) => c.json({ status: "ok" }));

Deno.serve(app.fetch);
