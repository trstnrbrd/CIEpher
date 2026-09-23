import { assertEquals, assertFalse } from "@std/assert";
import type { Accounts, Player } from "./accounts.ts";
import { type AppConfig, createApp } from "./app.ts";
import { ApiError } from "./errors.ts";
import { type Exam, isExam } from "./exam.ts";
import type { Game } from "./game.ts";
import type { LoginInput, RegisterInput, SubmitInput } from "./schemas.ts";

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
    register: () => Promise.resolve({ session: null, profile: PLAYER }),

    login: () => Promise.resolve({ session: SESSION, profile: PLAYER }),
    requestPasswordReset: () => Promise.resolve(),
    // Only "valid-token" belongs to a logged-in player.
    verifyToken: (token) =>
      Promise.resolve(token === "valid-token" ? PLAYER.id : null),
    getProfile: () => Promise.resolve(PLAYER),
    setCharacter: (_player, character) =>
      Promise.resolve({ ...PLAYER, character }),
    ...overrides,
  };
}

// A new player's progress: only the prologue's first mission is open.
const PROGRESS = {
  chapters: [
    {
      id: 0,
      unlocked: true,
      completed: false,
      missions: [{ number: 1, unlocked: true, completed: false }],
    },
  ],
};

function fakeGame(overrides: Partial<Game> = {}): Game {
  return {
    getProgress: () => Promise.resolve(PROGRESS),
    // Only prologue mission 1's real answer is correct. A wrong one gets a
    // made-up mistake: finding the real ones is csharp.ts's job.
    submitAnswer: (_player, input) =>
      Promise.resolve(
        input.answer === "OpenDoor();"
          ? { correct: true }
          : { correct: false, mistakes: [{ start: 8, end: 9 }] },
      ),
    ...overrides,
  };
}

// The exam stand-in. Its point is that answering says nothing about being
// right: only finish() ever gives a score.
const EXAM_STATE = {
  chapter: 8,
  mission: 1,
  attempts: 0,
  lastScore: null,
  bestScore: null,
  passed: false,
  running: false,
};

function fakeExam(overrides: Partial<Exam> = {}): Exam {
  return {
    start: () =>
      Promise.resolve({
        attemptNumber: 1,
        totalItems: 10,
        passScore: 7,
        answered: 0,
      }),
    answer: (_player, input) =>
      Promise.resolve({
        saved: true,
        answered: input.question,
        totalItems: 10,
      }),
    finish: () =>
      Promise.resolve({
        attemptNumber: 1,
        score: 8,
        totalItems: 10,
        passScore: 7,
        passed: true,
      }),
    state: () => Promise.resolve(EXAM_STATE),
    ...overrides,
  };
}

function testApp(overrides: Partial<AppConfig> = {}) {
  return createApp({
    allowedOrigins: [FRONTEND],
    accounts: fakeAccounts(),
    game: fakeGame(),
    exam: fakeExam(),
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
  const reported: { error: unknown; route: string }[] = [];
  const app = testApp({
    reportError: (error, { route }) => reported.push({ error, route }),
  });
  const crash = new Error("database password is hunter2");
  app.get("/test-crash", () => {
    throw crash;
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
    // Reported once, with only the route alongside the error.
    assertEquals(reported, [{ error: crash, route: "GET /api/test-crash" }]);
  } finally {
    console.error = originalError;
  }
});

Deno.test(
  "a broken error reporter doesn't break the player's answer",
  async () => {
    const app = testApp({
      reportError: () => {
        throw new Error("Sentry is down");
      },
    });
    app.get("/test-crash", () => {
      throw new Error("the real bug");
    });

    const originalError = console.error;
    console.error = () => {};
    try {
      const res = await app.request("/api/test-crash");
      assertEquals(res.status, 500);
      assertEquals((await res.json()).error.code, "INTERNAL_ERROR");
    } finally {
      console.error = originalError;
    }
  },
);

Deno.test("errors players are allowed to see are not reported", async () => {
  const reported: unknown[] = [];
  const app = testApp({ reportError: (error) => reported.push(error) });
  app.get("/test-api-error", () => {
    throw new ApiError(
      409,
      "USERNAME_TAKEN",
      "That username is already taken.",
    );
  });

  assertEquals((await app.request("/api/test-api-error")).status, 409);
  assertEquals(
    (await postJson(app, "/api/auth/register", { username: "x" })).status,
    400,
  );
  assertEquals((await app.request("/api/me")).status, 401);
  assertEquals(reported, []);
});

// ---------- POST /api/auth/register ----------

Deno.test(
  "register: creates the account and returns the profile, not logged in",
  async () => {
    let received: RegisterInput | undefined;
    const app = testApp({
      accounts: fakeAccounts({
        register: (input) => {
          received = input;
          return Promise.resolve({ session: null, profile: PLAYER });
        },
      }),
    });
    const res = await postJson(app, "/api/auth/register", VALID_REGISTRATION);
    assertEquals(res.status, 201);
    assertEquals(await res.json(), { session: null, profile: PLAYER });
    assertEquals(received, VALID_REGISTRATION);
  },
);

// ---------- the "I'm not a robot" check on register ----------

// A stand-in for Cloudflare Turnstile: only "human-token" passes.
function fakeHumanCheck(calls: [string, string | undefined][] = []) {
  return (token: string, ip: string | undefined) => {
    calls.push([token, ip]);
    return Promise.resolve(token === "human-token");
  };
}

Deno.test(
  "register: with the robot check on, a token is required",
  async () => {
    let registered = false;
    const app = testApp({
      humanCheck: fakeHumanCheck(),
      accounts: fakeAccounts({
        register: () => {
          registered = true;
          return Promise.resolve({ session: null, profile: PLAYER });
        },
      }),
    });
    const res = await postJson(app, "/api/auth/register", VALID_REGISTRATION);
    assertEquals(res.status, 400);
    assertEquals(await res.json(), {
      error: {
        code: "HUMAN_CHECK_REQUIRED",
        message: 'Please tick the "I\'m not a robot" check first.',
        field: "turnstileToken",
      },
    });
    assertFalse(registered);
  },
);

Deno.test("register: a token Cloudflare refuses makes no account", async () => {
  let registered = false;
  const app = testApp({
    humanCheck: fakeHumanCheck(),
    accounts: fakeAccounts({
      register: () => {
        registered = true;
        return Promise.resolve({ session: null, profile: PLAYER });
      },
    }),
  });
  const res = await postJson(app, "/api/auth/register", {
    ...VALID_REGISTRATION,
    turnstileToken: "bot-token",
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error.code, "HUMAN_CHECK_FAILED");
  assertEquals(body.error.field, "turnstileToken");
  assertFalse(registered);
});

Deno.test(
  "register: a person's token creates the account; the token isn't passed on",
  async () => {
    const calls: [string, string | undefined][] = [];
    let received: RegisterInput | undefined;
    const app = testApp({
      humanCheck: fakeHumanCheck(calls),
      accounts: fakeAccounts({
        register: (input) => {
          received = input;
          return Promise.resolve({ session: null, profile: PLAYER });
        },
      }),
    });
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      },
      body: JSON.stringify({
        ...VALID_REGISTRATION,
        turnstileToken: "human-token",
      }),
    });
    assertEquals(res.status, 201);
    assertEquals(calls, [["human-token", "203.0.113.7"]]);
    assertEquals(received, VALID_REGISTRATION);
  },
);

Deno.test(
  "register: if Cloudflare can't be reached, the player can try again later",
  async () => {
    const reported: unknown[] = [];
    let registered = false;
    const app = testApp({
      humanCheck: () => Promise.reject(new Error("network down")),
      reportError: (error) => reported.push(error),
      accounts: fakeAccounts({
        register: () => {
          registered = true;
          return Promise.resolve({ session: null, profile: PLAYER });
        },
      }),
    });
    const res = await postJson(app, "/api/auth/register", {
      ...VALID_REGISTRATION,
      turnstileToken: "human-token",
    });
    assertEquals(res.status, 503);
    const body = await res.json();
    assertEquals(body.error.code, "HUMAN_CHECK_UNAVAILABLE");
    assertFalse(registered);
    assertEquals(reported, []);
  },
);

Deno.test("register: a far too long robot token is refused", async () => {
  const res = await postJson(testApp(), "/api/auth/register", {
    ...VALID_REGISTRATION,
    turnstileToken: "x".repeat(2049),
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error.field, "turnstileToken");
});

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

// ---------- POST /api/auth/login ----------

Deno.test("login: returns session + profile", async () => {
  let received: LoginInput | undefined;
  const app = testApp({
    accounts: fakeAccounts({
      login: (input) => {
        received = input;
        return Promise.resolve({ session: SESSION, profile: PLAYER });
      },
    }),
  });
  const res = await postJson(app, "/api/auth/login", {
    username: "player_one",
    password: "secret123",
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { session: SESSION, profile: PLAYER });
  assertEquals(received, { username: "player_one", password: "secret123" });
});

Deno.test(
  "login: a missing password is a 400 that names the field",
  async () => {
    const res = await postJson(testApp(), "/api/auth/login", {
      username: "player_one",
    });
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.field, "password");
  },
);

Deno.test("login: wrong username or password comes back as 401", async () => {
  const app = testApp({
    accounts: fakeAccounts({
      login: () => {
        throw new ApiError(
          401,
          "INVALID_CREDENTIALS",
          "Wrong username or password.",
        );
      },
    }),
  });
  const res = await postJson(app, "/api/auth/login", {
    username: "player_one",
    password: "wrong-pass1",
  });
  assertEquals(res.status, 401);
  assertEquals(await res.json(), {
    error: {
      code: "INVALID_CREDENTIALS",
      message: "Wrong username or password.",
    },
  });
});

Deno.test("login: a locked username comes back as 429", async () => {
  const app = testApp({
    accounts: fakeAccounts({
      login: () => {
        throw new ApiError(
          429,
          "TOO_MANY_ATTEMPTS",
          "Too many failed attempts. Try again in 15 minutes.",
        );
      },
    }),
  });
  const res = await postJson(app, "/api/auth/login", {
    username: "player_one",
    password: "secret123",
  });
  assertEquals(res.status, 429);
  assertEquals(await res.json(), {
    error: {
      code: "TOO_MANY_ATTEMPTS",
      message: "Too many failed attempts. Try again in 15 minutes.",
    },
  });
});

// ---------- POST /api/auth/forgot-password ----------

Deno.test("forgot password: always gives the same answer", async () => {
  let asked: string | undefined;
  const app = testApp({
    accounts: fakeAccounts({
      requestPasswordReset: ({ username }) => {
        asked = username;
        return Promise.resolve();
      },
    }),
  });
  const res = await postJson(app, "/api/auth/forgot-password", {
    username: "  player_one ",
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ok: true });
  assertEquals(asked, "player_one");
});

Deno.test("forgot password: a missing username is a 400", async () => {
  const res = await postJson(testApp(), "/api/auth/forgot-password", {});
  assertEquals(res.status, 400);
  assertEquals(await res.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: "Username is required.",
      field: "username",
    },
  });
});

Deno.test(
  "forgot password: with the robot check on, a token is required",
  async () => {
    let asked = false;
    const app = testApp({
      humanCheck: fakeHumanCheck(),
      accounts: fakeAccounts({
        requestPasswordReset: () => {
          asked = true;
          return Promise.resolve();
        },
      }),
    });
    const res = await postJson(app, "/api/auth/forgot-password", {
      username: "player_one",
    });
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error.code, "HUMAN_CHECK_REQUIRED");
    assertEquals(body.error.field, "turnstileToken");
    assertFalse(asked);
  },
);

Deno.test(
  "forgot password: a token Cloudflare refuses sends no email",
  async () => {
    let asked = false;
    const app = testApp({
      humanCheck: fakeHumanCheck(),
      accounts: fakeAccounts({
        requestPasswordReset: () => {
          asked = true;
          return Promise.resolve();
        },
      }),
    });
    const res = await postJson(app, "/api/auth/forgot-password", {
      username: "player_one",
      turnstileToken: "bot-token",
    });
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error.code, "HUMAN_CHECK_FAILED");
    assertFalse(asked);
  },
);

Deno.test(
  "forgot password: a person's token sends the link; the token isn't passed on",
  async () => {
    const calls: [string, string | undefined][] = [];
    let received: unknown;
    const app = testApp({
      humanCheck: fakeHumanCheck(calls),
      accounts: fakeAccounts({
        requestPasswordReset: (input) => {
          received = input;
          return Promise.resolve();
        },
      }),
    });
    const res = await app.request("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.9",
      },
      body: JSON.stringify({
        username: "player_one",
        turnstileToken: "human-token",
      }),
    });
    assertEquals(res.status, 200);
    assertEquals(await res.json(), { ok: true });
    assertEquals(calls, [["human-token", "203.0.113.9"]]);
    assertEquals(received, { username: "player_one" });
  },
);

Deno.test(
  "forgot password: if Cloudflare can't be reached, no email is sent",
  async () => {
    let asked = false;
    const app = testApp({
      humanCheck: () => Promise.reject(new Error("network down")),
      accounts: fakeAccounts({
        requestPasswordReset: () => {
          asked = true;
          return Promise.resolve();
        },
      }),
    });
    const res = await postJson(app, "/api/auth/forgot-password", {
      username: "player_one",
      turnstileToken: "human-token",
    });
    assertEquals(res.status, 503);
    assertEquals((await res.json()).error.code, "HUMAN_CHECK_UNAVAILABLE");
    assertFalse(asked);
  },
);

// ---------- logged-in routes: GET /api/me, PUT /api/me/character ----------

const UNAUTHORIZED = {
  error: { code: "UNAUTHORIZED", message: "Please log in again." },
};

Deno.test("me: without a token is 401", async () => {
  const res = await testApp().request("/api/me");
  assertEquals(res.status, 401);
  assertEquals(await res.json(), UNAUTHORIZED);
});

Deno.test("me: with an invalid token is 401", async () => {
  const res = await testApp().request("/api/me", {
    headers: { authorization: "Bearer stolen-or-expired" },
  });
  assertEquals(res.status, 401);
  assertEquals(await res.json(), UNAUTHORIZED);
});

Deno.test("me: returns the logged-in player's profile", async () => {
  let asked: Player | undefined;
  const app = testApp({
    accounts: fakeAccounts({
      getProfile: (player) => {
        asked = player;
        return Promise.resolve(PLAYER);
      },
    }),
  });
  const res = await app.request("/api/me", {
    headers: { authorization: "Bearer valid-token" },
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { profile: PLAYER });
  assertEquals(asked, { id: PLAYER.id, accessToken: "valid-token" });
});

function putCharacter(body: unknown, token = "valid-token") {
  return testApp().request("/api/me/character", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

Deno.test("character: saves boy or girl", async () => {
  const res = await putCharacter({ character: "girl" });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), {
    profile: { ...PLAYER, character: "girl" },
  });
});

Deno.test("character: rejects anything else and names the field", async () => {
  const res = await putCharacter({ character: "dragon" });
  assertEquals(res.status, 400);
  assertEquals(await res.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: 'Character must be "boy" or "girl".',
      field: "character",
    },
  });
});

Deno.test("character: requires login", async () => {
  const res = await putCharacter({ character: "boy" }, "stolen-or-expired");
  assertEquals(res.status, 401);
  assertEquals(await res.json(), UNAUTHORIZED);
});

// ---------- GET /api/progress ----------

Deno.test("progress: requires login", async () => {
  const res = await testApp().request("/api/progress");
  assertEquals(res.status, 401);
  assertEquals(await res.json(), UNAUTHORIZED);
});

Deno.test("progress: returns the logged-in player's progress", async () => {
  let asked: Player | undefined;
  const app = testApp({
    game: fakeGame({
      getProgress: (player) => {
        asked = player;
        return Promise.resolve(PROGRESS);
      },
    }),
  });
  const res = await app.request("/api/progress", {
    headers: { authorization: "Bearer valid-token" },
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ...PROGRESS, exam: EXAM_STATE });
  assertEquals(asked, { id: PLAYER.id, accessToken: "valid-token" });
});

// ---------- POST /api/missions/submit ----------

const MISSION_1 = { chapter: 0, mission: 1 };

function submit(body: unknown, token = "valid-token", app = testApp()) {
  return app.request("/api/missions/submit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

Deno.test("submit: requires login", async () => {
  const res = await submit(
    { ...MISSION_1, answer: "OpenDoor();" },
    "stolen-or-expired",
  );
  assertEquals(res.status, 401);
  assertEquals(await res.json(), UNAUTHORIZED);
});

Deno.test("submit: a right answer comes back as correct", async () => {
  let received: { player: Player; input: SubmitInput } | undefined;
  const app = testApp({
    game: fakeGame({
      submitAnswer: (player, input) => {
        received = { player, input };
        return Promise.resolve({ correct: true });
      },
    }),
  });
  const res = await submit(
    { ...MISSION_1, answer: "  OpenDoor();  " },
    "valid-token",
    app,
  );
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { correct: true });
  // The answer arrives exactly as typed (mistakes are counted from it), for
  // the verified player. Without a question number, it's question 1.
  assertEquals(received, {
    player: { id: PLAYER.id, accessToken: "valid-token" },
    input: { ...MISSION_1, question: 1, answer: "  OpenDoor();  " },
  });
});

Deno.test("submit: the question number is passed on", async () => {
  let received: SubmitInput | undefined;
  const app = testApp({
    game: fakeGame({
      submitAnswer: (_player, input) => {
        received = input;
        return Promise.resolve({ correct: false, mistakes: [] });
      },
    }),
  });
  const res = await submit(
    { chapter: 1, mission: 1, question: 2, answer: "if" },
    "valid-token",
    app,
  );
  assertEquals(res.status, 200);
  assertEquals(received, { chapter: 1, mission: 1, question: 2, answer: "if" });
});

Deno.test("submit: a wrong answer is a normal 200, not an error", async () => {
  const res = await submit({ ...MISSION_1, answer: "OpenDoor:" });
  assertEquals(res.status, 200);
  // With where it's wrong, passed on as the game found it.
  assertEquals(await res.json(), {
    correct: false,
    mistakes: [{ start: 8, end: 9 }],
  });
});

Deno.test("submit: an empty answer is a 400 that names the field", async () => {
  const res = await submit({ ...MISSION_1, answer: "   " });
  assertEquals(res.status, 400);
  assertEquals(await res.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: "Type your answer first.",
      field: "answer",
    },
  });
});

Deno.test("submit: an answer over 500 characters is a 400", async () => {
  const res = await submit({ ...MISSION_1, answer: "x".repeat(501) });
  assertEquals(res.status, 400);
  assertEquals(await res.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: "That answer is too long.",
      field: "answer",
    },
  });
});

Deno.test("submit: chapter and mission must be whole numbers", async () => {
  const res = await submit({ chapter: "zero", mission: 1, answer: "x" });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error.field, "chapter");
});

Deno.test("submit: the question is a whole number from 1 to 10", async () => {
  for (const question of [0, 11, 1.5, "2"]) {
    const res = await submit({ ...MISSION_1, question, answer: "x" });
    assertEquals(res.status, 400);
    assertEquals(await res.json(), {
      error: {
        code: "VALIDATION_ERROR",
        message: "Question must be a whole number from 1 to 10.",
        field: "question",
      },
    });
  }
});

Deno.test("submit: a locked mission comes back as 403", async () => {
  const app = testApp({
    game: fakeGame({
      submitAnswer: () => {
        throw new ApiError(
          403,
          "MISSION_LOCKED",
          "That mission is still locked.",
        );
      },
    }),
  });
  const res = await submit(
    { chapter: 0, mission: 3, answer: "RideJeep();" },
    "valid-token",
    app,
  );
  assertEquals(res.status, 403);
  assertEquals(await res.json(), {
    error: { code: "MISSION_LOCKED", message: "That mission is still locked." },
  });
});

Deno.test(
  "submit: a question that doesn't exist comes back as 404",
  async () => {
    const app = testApp({
      game: fakeGame({
        submitAnswer: () => {
          throw new ApiError(
            404,
            "QUESTION_NOT_FOUND",
            "That question doesn't exist.",
          );
        },
      }),
    });
    const res = await submit(
      { ...MISSION_1, question: 3, answer: "OpenDoor();" },
      "valid-token",
      app,
    );
    assertEquals(res.status, 404);
    assertEquals(await res.json(), {
      error: {
        code: "QUESTION_NOT_FOUND",
        message: "That question doesn't exist.",
      },
    });
  },
);

// ---------- the epilogue exam (POST /api/exam/*) ----------

function examPost(
  path: string,
  body?: unknown,
  token = "valid-token",
  app = testApp(),
) {
  return app.request(`/api/exam/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body ?? {}),
  });
}

Deno.test("exam: every route requires login", async () => {
  for (const path of ["start", "answer", "finish"]) {
    const res = await examPost(path, { question: 1, answer: "x" }, "nope");
    assertEquals(res.status, 401);
    assertEquals(await res.json(), UNAUTHORIZED);
  }
});

Deno.test("exam: starting says how many items and what passes", async () => {
  let asked: Player | undefined;
  const app = testApp({
    exam: fakeExam({
      start: (player) => {
        asked = player;
        return Promise.resolve({
          attemptNumber: 2,
          totalItems: 10,
          passScore: 7,
          answered: 3,
        });
      },
    }),
  });
  const res = await examPost("start", {}, "valid-token", app);
  assertEquals(res.status, 200);
  assertEquals(await res.json(), {
    attemptNumber: 2,
    totalItems: 10,
    passScore: 7,
    answered: 3,
  });
  assertEquals(asked, { id: PLAYER.id, accessToken: "valid-token" });
});

Deno.test(
  "exam: an answer is saved without saying if it was right",
  async () => {
    let got: { question: number; answer: string } | undefined;
    const app = testApp({
      exam: fakeExam({
        answer: (_player, input) => {
          got = input;
          return Promise.resolve({ saved: true, answered: 4, totalItems: 10 });
        },
      }),
    });
    const res = await examPost(
      "answer",
      { question: 4, answer: "if(hasID)" },
      "valid-token",
      app,
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body, { saved: true, answered: 4, totalItems: 10 });
    // The whole point of the exam: nothing about being right.
    assertFalse("correct" in body);
    assertFalse("mistakes" in body);
    assertEquals(got, { question: 4, answer: "if(hasID)" });
  },
);

Deno.test("exam: the item number and the answer are checked", async () => {
  const bad = await examPost("answer", { question: 11, answer: "x" });
  assertEquals(bad.status, 400);
  assertEquals(await bad.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: "Question must be a whole number from 1 to 10.",
      field: "question",
    },
  });

  const empty = await examPost("answer", { question: 1, answer: "   " });
  assertEquals(empty.status, 400);
  assertEquals(await empty.json(), {
    error: {
      code: "VALIDATION_ERROR",
      message: "Type your answer first.",
      field: "answer",
    },
  });
});

Deno.test("exam: finishing gives the score and the verdict", async () => {
  const app = testApp({
    exam: fakeExam({
      finish: () =>
        Promise.resolve({
          attemptNumber: 1,
          score: 6,
          totalItems: 10,
          passScore: 7,
          passed: false,
        }),
    }),
  });
  const res = await examPost("finish", {}, "valid-token", app);
  assertEquals(res.status, 200);
  assertEquals(await res.json(), {
    attemptNumber: 1,
    score: 6,
    totalItems: 10,
    passScore: 7,
    passed: false,
  });
});

Deno.test("exam: answering before starting is refused", async () => {
  const app = testApp({
    exam: fakeExam({
      answer: () => {
        throw new ApiError(
          409,
          "NO_EXAM_RUNNING",
          "Start the exam before answering.",
        );
      },
    }),
  });
  const res = await examPost(
    "answer",
    { question: 1, answer: "x" },
    "valid-token",
    app,
  );
  assertEquals(res.status, 409);
  assertEquals(await res.json(), {
    error: {
      code: "NO_EXAM_RUNNING",
      message: "Start the exam before answering.",
    },
  });
});

Deno.test("exam: only chapter 8 mission 1 is the exam", () => {
  assertEquals(isExam(8, 1), true);
  assertFalse(isExam(8, 2));
  assertFalse(isExam(7, 1));
  assertFalse(isExam(0, 1));
});
