import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import type { Accounts } from "./accounts.ts";
import { ApiError, handleError, handleNotFound } from "./errors.ts";
import { loginSchema, parse, registerSchema } from "./schemas.ts";

export type AppConfig = {
  // Websites allowed to call this API from a browser, e.g. Vhan's local Vite app.
  allowedOrigins: string[];
  // Player accounts: the real Supabase version in index.ts, a fake in tests.
  accounts: Accounts;
};

// Builds the whole API. Settings come in as arguments (not read from the
// environment here), so tests can create an app with any settings they need.
export function createApp({ allowedOrigins, accounts }: AppConfig) {
  const app = new Hono().basePath("/api");

  app.use(
    "*",
    cors({
      origin: allowedOrigins,
      allowHeaders: [
        "authorization",
        "x-client-info",
        "apikey",
        "content-type",
      ],
      allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    }),
  );

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.post("/auth/register", async (c) => {
    const input = parse(registerSchema, await readJson(c));
    const result = await accounts.register(input);
    return c.json(result, 201);
  });

  app.post("/auth/login", async (c) => {
    const input = parse(loginSchema, await readJson(c));
    const result = await accounts.login(input);
    return c.json(result, 200);
  });

  app.notFound(handleNotFound);
  app.onError(handleError);

  return app;
}

// Reads the JSON body, turning broken JSON into a 400 instead of a crash.
async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "The request body must be valid JSON.",
    );
  }
}
