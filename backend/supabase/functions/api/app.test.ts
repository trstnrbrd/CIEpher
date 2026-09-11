import { assertEquals, assertFalse } from "@std/assert";
import { createApp } from "./app.ts";
import { ApiError } from "./errors.ts";

const FRONTEND = "http://localhost:5173";

Deno.test("GET /api/health returns ok", async () => {
  const app = createApp({ allowedOrigins: [FRONTEND] });
  const res = await app.request("/api/health");
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { status: "ok" });
});

Deno.test("unknown routes return the standard 404 error", async () => {
  const app = createApp({ allowedOrigins: [FRONTEND] });
  const res = await app.request("/api/nope");
  assertEquals(res.status, 404);
  assertEquals(await res.json(), {
    error: { code: "NOT_FOUND", message: "That route doesn't exist." },
  });
});

Deno.test("CORS allows the frontend", async () => {
  const app = createApp({ allowedOrigins: [FRONTEND] });
  const res = await app.request("/api/health", {
    headers: { Origin: FRONTEND },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), FRONTEND);
});

Deno.test("CORS blocks other websites", async () => {
  const app = createApp({ allowedOrigins: [FRONTEND] });
  const res = await app.request("/api/health", {
    headers: { Origin: "https://evil.example" },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), null);
});

Deno.test("CORS blocks everyone when no origins are configured", async () => {
  const app = createApp({ allowedOrigins: [] });
  const res = await app.request("/api/health", {
    headers: { Origin: FRONTEND },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), null);
});

Deno.test("ApiError is sent to the player as-is", async () => {
  const app = createApp({ allowedOrigins: [] });
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
  const app = createApp({ allowedOrigins: [] });
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
