import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import type { Accounts, Player } from "./accounts.ts";
import { ApiError, handleError, handleNotFound } from "./errors.ts";
import {
  characterSchema,
  loginSchema,
  parse,
  registerSchema,
} from "./schemas.ts";

// What the login check (requirePlayer) hands to the routes after it.
type Env = { Variables: { player: Player } };

export type AppConfig = {
  // Websites allowed to call this API from a browser, e.g. Vhan's local Vite app.
  allowedOrigins: string[];
  // Player accounts: the real Supabase version in index.ts, a fake in tests.
  accounts: Accounts;
};

// Builds the whole API. Settings come in as arguments (not read from the
// environment here), so tests can create an app with any settings they need.
export function createApp({ allowedOrigins, accounts }: AppConfig) {
  const app = new Hono<Env>().basePath("/api");

  // Lets only logged-in players through: the request must carry a valid
  // access token ("Authorization: Bearer <token>").
  const requirePlayer = createMiddleware<Env>(async (c, next) => {
    const header = c.req.header("authorization") ?? "";
    const accessToken = header.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
    const id = accessToken ? await accounts.verifyToken(accessToken) : null;
    if (!id) {
      throw new ApiError(401, "UNAUTHORIZED", "Please log in again.");
    }
    c.set("player", { id, accessToken });
    await next();
  });

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

  app.get("/me", requirePlayer, async (c) => {
    const profile = await accounts.getProfile(c.get("player"));
    return c.json({ profile });
  });

  app.put("/me/character", requirePlayer, async (c) => {
    const { character } = parse(characterSchema, await readJson(c));
    const profile = await accounts.setCharacter(c.get("player"), character);
    return c.json({ profile });
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
