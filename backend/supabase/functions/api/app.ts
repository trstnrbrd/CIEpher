import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import type { Accounts, Player } from "./accounts.ts";
import {
  ApiError,
  errorHandler,
  handleNotFound,
  type ReportError,
} from "./errors.ts";
import type { Game } from "./game.ts";
import type { HumanCheck } from "./humans.ts";
import {
  characterSchema,
  forgotPasswordSchema,
  loginSchema,
  parse,
  registerSchema,
  submitSchema,
} from "./schemas.ts";

// What the login check (requirePlayer) hands to the routes after it.
type Env = { Variables: { player: Player } };

export type AppConfig = {
  // Websites allowed to call this API from a browser, e.g. Vhan's local Vite app.
  allowedOrigins: string[];
  // Player accounts: the real Supabase version in index.ts, a fake in tests.
  accounts: Accounts;
  // The game itself (progress, then answers): the same, real or fake.
  game: Game;
  // Where bugs (the 500s) are reported: Sentry in index.ts, a fake in tests.
  // Left out, bugs are only logged.
  reportError?: ReportError;
  // The "I'm not a robot" check on registering: Cloudflare Turnstile in
  // index.ts when its secret key is set, a fake in tests. Left out,
  // registering needs no check.
  humanCheck?: HumanCheck;
};

// Builds the whole API. Settings come in as arguments (not read from the
// environment here), so tests can create an app with any settings they need.
export function createApp({
  allowedOrigins,
  accounts,
  game,
  reportError,
  humanCheck,
}: AppConfig) {
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

  // Refuses a request unless Cloudflare says a person sent it, when the robot
  // check is switched on (register and forgot password).
  const requireHuman = async (
    c: Context,
    token: string | undefined,
  ): Promise<void> => {
    if (!humanCheck) return;
    // The first address in X-Forwarded-For is the player's.
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    await confirmHuman(humanCheck, token, ip);
  };

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
    const { turnstileToken, ...input } = parse(
      registerSchema,
      await readJson(c),
    );
    await requireHuman(c, turnstileToken);
    const result = await accounts.register(input);
    return c.json(result, 201);
  });

  app.post("/auth/login", async (c) => {
    const input = parse(loginSchema, await readJson(c));
    const result = await accounts.login(input);
    return c.json(result, 200);
  });

  app.post("/auth/forgot-password", async (c) => {
    const { turnstileToken, ...input } = parse(
      forgotPasswordSchema,
      await readJson(c),
    );
    // Before the username is looked up, so the check can't reveal who exists.
    await requireHuman(c, turnstileToken);
    await accounts.requestPasswordReset(input);
    // The same answer whether or not the username exists.
    return c.json({ ok: true });
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

  app.get("/progress", requirePlayer, async (c) => {
    const progress = await game.getProgress(c.get("player"));
    return c.json(progress);
  });

  app.post("/missions/submit", requirePlayer, async (c) => {
    const input = parse(submitSchema, await readJson(c));
    const result = await game.submitAnswer(c.get("player"), input);
    return c.json(result);
  });

  app.notFound(handleNotFound);
  app.onError(errorHandler(reportError));

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

// Refuses a register request unless Cloudflare says a person sent it.
async function confirmHuman(
  check: HumanCheck,
  token: string | undefined,
  ip: string | undefined,
): Promise<void> {
  if (!token) {
    throw new ApiError(
      400,
      "HUMAN_CHECK_REQUIRED",
      'Please tick the "I\'m not a robot" check first.',
      "turnstileToken",
    );
  }
  let passed: boolean;
  try {
    passed = await check(token, ip);
  } catch (error) {
    console.error("Turnstile check failed:", error);
    throw new ApiError(
      503,
      "HUMAN_CHECK_UNAVAILABLE",
      "We couldn't run the robot check right now. Please try again in a moment.",
    );
  }
  if (!passed) {
    throw new ApiError(
      400,
      "HUMAN_CHECK_FAILED",
      "The robot check didn't go through. Please try it again.",
      "turnstileToken",
    );
  }
}
