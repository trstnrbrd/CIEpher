import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { handleError, handleNotFound, ApiError } from "./errors.ts";
import type { AuthProvider, SignUpInput, UserSession } from "./auth.ts";

export type AppConfig = {
  // Websites allowed to call this API from a browser, e.g. Vhan's local Vite app.
  allowedOrigins: string[];
  // Auth implementation. Supplied by the entrypoint so tests can fake it.
  auth: AuthProvider;
};

function stringField(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, "VALIDATION_ERROR", `${name} is required.`);
  }
  return value.trim();
}

function validateSignUp(body: Record<string, unknown>): SignUpInput {
  const username = stringField(body.username, "username");
  const email = stringField(body.email, "email");
  const password = stringField(body.password, "password");

  if (username.length < 3 || username.length > 20) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Username must be between 3 and 20 characters.",
    );
  }
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Username can only contain letters, numbers and underscores.",
    );
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, "VALIDATION_ERROR", "That email doesn't look valid.");
  }
  if (password.length < 8) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Password must be at least 8 characters.",
    );
  }
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Password must contain letters and numbers.",
    );
  }
  if (body.consent !== true) {
    throw new ApiError(
      400,
      "CONSENT_REQUIRED",
      "You must agree to the Privacy Notice to create an account.",
    );
  }

  const gender = typeof body.gender === "string" ? body.gender.trim() : "";
  const yearLevel = typeof body.yearLevel === "string" ? body.yearLevel.trim() : "";
  return {
    username,
    email,
    password,
    gender,
    yearLevel,
    privacyConsent: true,
  };
}

async function jsonBody(c: Context): Promise<Record<string, unknown>> {
  return (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
}

// Builds the whole API. Settings come in as arguments (not read from the
// environment here), so tests can create an app with any settings they need.
export function createApp({ allowedOrigins, auth }: AppConfig) {
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

  app.post("/auth/sign-in", async (c) => {
    const body = await jsonBody(c);
    const username = stringField(body.username, "username");
    const password = stringField(body.password, "password");
    const session = await auth.signIn(username, password);
    return c.json(toSessionResponse(session), 200);
  });

  app.post("/auth/sign-up", async (c) => {
    const body = await jsonBody(c);
    const input = validateSignUp(body);
    const session = await auth.signUp(input);
    return c.json(toSessionResponse(session), 201);
  });

  app.notFound(handleNotFound);
  app.onError(handleError);

  return app;
}

function toSessionResponse(session: UserSession) {
  return {
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    user: {
      id: session.user.id,
      email: session.user.email,
    },
  };
}