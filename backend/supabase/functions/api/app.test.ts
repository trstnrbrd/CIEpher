import { assertEquals, assertFalse } from "@std/assert";
import type { Accounts } from "./accounts.ts";
import { type AppConfig, createApp } from "./app.ts";
import { ApiError } from "./errors.ts";
import type { RegisterInput } from "./schemas.ts";

const FRONTEND = "http://localhost:5173";
const PLAYER = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "player_one",
  character: null,
};
const SESSION = { accessToken: "test-access", refreshToken: "test-refresh" };
const VALID_REGISTRATION = {
  username: "player_one",
  email: "player@example.com",
  password: "secret123",
  privacyConsent: true,
};

// A stand-in for Supabase, so these tests never touch a real database.
function fakeAccounts(overrides: Partial<Accounts> = {}): Accounts {
  return {
    register: () => Promise.resolve({ session: SESSION, profile: PLAYER }),
    ...overrides,
  };
}

function testApp(overrides: Partial<AppConfig> = {}) {
  return createApp({
    allowedOrigins: [FRONTEND],
    accounts: fakeAccounts(),
    ...overrides,
  });
}

function postJson(
  app: ReturnType<typeof createApp>,
  path: string,
  body: unknown,
) {
  return app.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

// ---------- basics ----------

Deno.test("GET /api/health returns ok", async () => {
  const res = await testApp().request("/api/health");
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { status: "ok" });
});

Deno.test("unknown routes return the standard 404 error", async () => {
  const res = await testApp().request("/api/nope");
  assertEquals(res.status, 404);
  assertEquals(await res.json(), {
    error: { code: "NOT_FOUND", message: "That route doesn't exist." },
  });
});

Deno.test("CORS allows the frontend", async () => {
  const res = await testApp().request("/api/health", {
    headers: { Origin: FRONTEND },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), FRONTEND);
});

Deno.test("CORS blocks other websites", async () => {
  const res = await testApp().request("/api/health", {
    headers: { Origin: "https://evil.example" },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), null);
});

Deno.test("CORS blocks everyone when no origins are configured", async () => {
  const res = await testApp({ allowedOrigins: [] }).request("/api/health", {
    headers: { Origin: FRONTEND },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), null);
});

Deno.test("ApiError is sent to the player as-is", async () => {
  const app = testApp();
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
  const app = testApp();
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

// ---------- POST /api/auth/register ----------

Deno.test(
  "register: creates the account and returns session + profile",
  async () => {
    let received: RegisterInput | undefined;
    const app = testApp({
      accounts: fakeAccounts({
        register: (input) => {
          received = input;
          return Promise.resolve({ session: SESSION, profile: PLAYER });
        },
      }),
    });
    const res = await postJson(app, "/api/auth/register", VALID_REGISTRATION);
    assertEquals(res.status, 201);
    assertEquals(await res.json(), { session: SESSION, profile: PLAYER });
    assertEquals(received, VALID_REGISTRATION);
  },
);

Deno.test("register: rejects a bad username and names the field", async () => {
  const res = await postJson(testApp(), "/api/auth/register", {
    ...VALID_REGISTRATION,
    username: "no spaces!",
  });
  assertEquals(res.status, 400);
  assertEquals(await res.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: "Username must be 3-20 letters, numbers, or underscores.",
      field: "username",
    },
  });
});

Deno.test("register: rejects a password without a number", async () => {
  const res = await postJson(testApp(), "/api/auth/register", {
    ...VALID_REGISTRATION,
    password: "onlyletters",
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error.field, "password");
});

Deno.test("register: requires privacy consent", async () => {
  const res = await postJson(testApp(), "/api/auth/register", {
    ...VALID_REGISTRATION,
    privacyConsent: false,
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error.field, "privacyConsent");
});

Deno.test("register: broken JSON is a 400, not a crash", async () => {
  const res = await postJson(testApp(), "/api/auth/register", "{not json");
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error.code, "VALIDATION_ERROR");
});

Deno.test("register: a taken username comes back as 409", async () => {
  const app = testApp({
    accounts: fakeAccounts({
      register: () => {
        throw new ApiError(
          409,
          "USERNAME_TAKEN",
          "That username is already taken.",
        );
      },
    }),
  });
  const res = await postJson(app, "/api/auth/register", VALID_REGISTRATION);
  assertEquals(res.status, 409);
  const body = await res.json();
  assertEquals(body.error.code, "USERNAME_TAKEN");
});
