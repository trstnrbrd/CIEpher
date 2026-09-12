import { assertEquals, assertFalse } from "@std/assert";
import { createApp } from "./app.ts";
import { ApiError } from "./errors.ts";
import type { AuthProvider, SignUpInput, UserSession } from "./auth.ts";

const FRONTEND = "http://localhost:5173";

const fakeSession: UserSession = {
  accessToken: "access-123",
  refreshToken: "refresh-123",
  user: { id: "user-123", email: "player@example.com" },
};

function fakeAuth(): AuthProvider & { lastSignUp?: SignUpInput; lastCharacter?: string } {
  let character: string | null = null;
  const auth: AuthProvider & { lastSignUp?: SignUpInput; lastCharacter?: string } = {
    async signIn(username: string, password: string) {
      if (username === "nobody") {
        throw new ApiError(401, "INVALID_CREDENTIALS", "Wrong username or password.");
      }
      return { ...fakeSession, user: { ...fakeSession.user, email: `${username}@example.com` } };
    },
    async signUp(input: SignUpInput) {
      auth.lastSignUp = input;
      return fakeSession;
    },
    async getProfile(accessToken: string) {
      if (accessToken !== "access-123") {
        throw new ApiError(
          401,
          "UNAUTHORIZED",
          "Your session has expired. Please log in again.",
        );
      }
      return { id: "user-123", username: "player_1", character };
    },
    async setCharacter(accessToken: string, next: string) {
      if (accessToken !== "access-123") {
        throw new ApiError(
          401,
          "UNAUTHORIZED",
          "Your session has expired. Please log in again.",
        );
      }
      auth.lastCharacter = next;
      character = next;
      return { id: "user-123", username: "player_1", character: next };
    },
  };
  return auth;
}

function appWith(auth: AuthProvider) {
  return createApp({ allowedOrigins: [FRONTEND], auth });
}

function postJson(app: ReturnType<typeof createApp>, path: string, body: unknown) {
  return app.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("GET /api/health returns ok", async () => {
  const app = appWith(fakeAuth());
  const res = await app.request("/api/health");
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { status: "ok" });
});

Deno.test("unknown routes return the standard 404 error", async () => {
  const app = appWith(fakeAuth());
  const res = await app.request("/api/nope");
  assertEquals(res.status, 404);
  assertEquals(await res.json(), {
    error: { code: "NOT_FOUND", message: "That route doesn't exist." },
  });
});

Deno.test("CORS allows the frontend", async () => {
  const app = appWith(fakeAuth());
  const res = await app.request("/api/health", {
    headers: { Origin: FRONTEND },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), FRONTEND);
});

Deno.test("CORS blocks other websites", async () => {
  const app = appWith(fakeAuth());
  const res = await app.request("/api/health", {
    headers: { Origin: "https://evil.example" },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), null);
});

Deno.test("CORS blocks everyone when no origins are configured", async () => {
  const app = createApp({ allowedOrigins: [], auth: fakeAuth() });
  const res = await app.request("/api/health", {
    headers: { Origin: FRONTEND },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), null);
});

Deno.test("ApiError is sent to the player as-is", async () => {
  const app = appWith(fakeAuth());
  app.get("/test-api-error", () => {
    throw new ApiError(
      409,
      "USERNAME_TAKEN",
      "That username is already taken.",
    );
  });
  const res = await app.request("/api/test-api-error");
  assertEquals(res.status, 409);
  assertEquals(await res.json(), {
    error: {
      code: "USERNAME_TAKEN",
      message: "That username is already taken.",
    },
  });
});

Deno.test("unexpected errors hide their details from the player", async () => {
  const app = appWith(fakeAuth());
  app.get("/test-crash", () => {
    throw new Error("database password is hunter2");
  });

  // The real error is logged on purpose. Capture it so the test can check it
  // was logged, and so it doesn't clutter the test output.
  const logged: unknown[][] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => logged.push(args);
  try {
    const res = await app.request("/api/test-crash");
    assertEquals(res.status, 500);
    const body = await res.text();
    assertFalse(body.includes("hunter2"));
    assertEquals(JSON.parse(body), {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
      },
    });
    assertEquals(logged.length, 1);
  } finally {
    console.error = originalError;
  }
});

Deno.test("POST /api/auth/sign-up accepts a valid registration with consent", async () => {
  const auth = fakeAuth();
  const app = appWith(auth);
  const res = await postJson(app, "/api/auth/sign-up", {
    username: "player_1",
    email: "player@example.com",
    password: "secret123",
    gender: "male",
    yearLevel: "3",
    consent: true,
  });
  assertEquals(res.status, 201);
  assertEquals(await res.json(), {
    access_token: "access-123",
    refresh_token: "refresh-123",
    user: { id: "user-123", email: "player@example.com" },
  });
  assertEquals(auth.lastSignUp, {
    username: "player_1",
    email: "player@example.com",
    password: "secret123",
    gender: "male",
    yearLevel: "3",
    privacyConsent: true,
  });
});

Deno.test("POST /api/auth/sign-up rejects a registration without consent", async () => {
  const app = appWith(fakeAuth());
  const res = await postJson(app, "/api/auth/sign-up", {
    username: "player_1",
    email: "player@example.com",
    password: "secret123",
    consent: false,
  });
  assertEquals(res.status, 400);
  assertEquals(await res.json(), {
    error: {
      code: "CONSENT_REQUIRED",
      message: "You must agree to the Privacy Notice to create an account.",
    },
  });
});

Deno.test("POST /api/auth/sign-up rejects a too-short username", async () => {
  const app = appWith(fakeAuth());
  const res = await postJson(app, "/api/auth/sign-up", {
    username: "ab",
    email: "player@example.com",
    password: "secret123",
    consent: true,
  });
  assertEquals(res.status, 400);
  assertEquals(await res.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: "Username must be between 3 and 20 characters.",
    },
  });
});

Deno.test("POST /api/auth/sign-up rejects illegal username characters", async () => {
  const app = appWith(fakeAuth());
  const res = await postJson(app, "/api/auth/sign-up", {
    username: "player.name",
    email: "player@example.com",
    password: "secret123",
    consent: true,
  });
  assertEquals(res.status, 400);
  assertEquals(await res.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: "Username can only contain letters, numbers and underscores.",
    },
  });
});

Deno.test("POST /api/auth/sign-in returns a session for a valid player", async () => {
  const app = appWith(fakeAuth());
  const res = await postJson(app, "/api/auth/sign-in", {
    username: "player_1",
    password: "secret123",
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), {
    access_token: "access-123",
    refresh_token: "refresh-123",
    user: { id: "user-123", email: "player_1@example.com" },
  });
});

Deno.test("POST /api/auth/sign-in sends auth errors to the player as-is", async () => {
  const app = appWith(fakeAuth());
  const res = await postJson(app, "/api/auth/sign-in", {
    username: "nobody",
    password: "wrong",
  });
  assertEquals(res.status, 401);
  assertEquals(await res.json(), {
    error: {
      code: "INVALID_CREDENTIALS",
      message: "Wrong username or password.",
    },
  });
});

Deno.test("GET /api/auth/me returns the profile for a valid token", async () => {
  const app = appWith(fakeAuth());
  const res = await app.request("/api/auth/me", {
    headers: { authorization: "Bearer access-123" },
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), {
    profile: { id: "user-123", username: "player_1", character: null },
  });
});

Deno.test("GET /api/auth/me rejects a missing token", async () => {
  const app = appWith(fakeAuth());
  const res = await app.request("/api/auth/me");
  assertEquals(res.status, 401);
  assertEquals(await res.json(), {
    error: {
      code: "UNAUTHORIZED",
      message: "Please log in first.",
    },
  });
});

Deno.test("GET /api/auth/me rejects an expired token", async () => {
  const app = appWith(fakeAuth());
  const res = await app.request("/api/auth/me", {
    headers: { authorization: "Bearer expired-token" },
  });
  assertEquals(res.status, 401);
  assertEquals(await res.json(), {
    error: {
      code: "UNAUTHORIZED",
      message: "Your session has expired. Please log in again.",
    },
  });
});

Deno.test("PUT /api/auth/character stores the chosen character", async () => {
  const auth = fakeAuth();
  const app = appWith(auth);
  const res = await app.request("/api/auth/character", {
    method: "PUT",
    headers: {
      authorization: "Bearer access-123",
      "content-type": "application/json",
    },
    body: JSON.stringify({ character: "boy" }),
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), {
    profile: { id: "user-123", username: "player_1", character: "boy" },
  });
  assertEquals(auth.lastCharacter, "boy");
});

Deno.test("PUT /api/auth/character rejects any value other than boy/girl", async () => {
  const app = appWith(fakeAuth());
  const res = await app.request("/api/auth/character", {
    method: "PUT",
    headers: {
      authorization: "Bearer access-123",
      "content-type": "application/json",
    },
    body: JSON.stringify({ character: "robot" }),
  });
  assertEquals(res.status, 400);
  assertEquals(await res.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: "Character must be 'boy' or 'girl'.",
    },
  });
});

Deno.test("PUT /api/auth/character rejects a missing token", async () => {
  const app = appWith(fakeAuth());
  const res = await app.request("/api/auth/character", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ character: "boy" }),
  });
  assertEquals(res.status, 401);
  assertEquals(await res.json(), {
    error: {
      code: "UNAUTHORIZED",
      message: "Please log in first.",
    },
  });
});