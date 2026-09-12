import { ApiError } from "./errors.ts";

// Everything the auth routes need from the environment. Injected so tests can
// pass fake values and fake HTTP functions.
export type AuthEnv = {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
};

export type SignUpInput = {
  username: string;
  email: string;
  password: string;
  gender?: string;
  yearLevel?: string;
  privacyConsent: boolean;
};

export type UserSession = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
};

// Public player data returned by GET /auth/me.
export type Profile = {
  id: string;
  username: string;
  character: string | null;
};

// The routes depend on this interface, not on Supabase directly, so tests can
// swap in a fake implementation.
export type AuthProvider = {
  signUp(input: SignUpInput): Promise<UserSession>;
  signIn(username: string, password: string): Promise<UserSession>;
  getProfile(accessToken: string): Promise<Profile>;
  setCharacter(accessToken: string, character: string): Promise<Profile>;
};

function unauthorized(): ApiError {
  return new ApiError(
    401,
    "UNAUTHORIZED",
    "Your session has expired. Please log in again.",
  );
}

async function goTrue(
  env: AuthEnv,
  path: string,
  init: { method: string; body?: unknown; key: string },
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${env.supabaseUrl}/auth/v1${path}`, {
    method: init.method,
    headers: {
      apikey: init.key,
      authorization: `Bearer ${init.key}`,
      "content-type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, json };
}

async function postgrest(
  env: AuthEnv,
  path: string,
  fields: Record<string, unknown>,
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1${path}`, {
    method: "POST",
    headers: {
      apikey: env.serviceRoleKey,
      authorization: `Bearer ${env.serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(fields),
  });
  const json = await res.json().catch(() => []);
  return { status: res.status, json };
}

async function getProfileByUsername(
  env: AuthEnv,
  username: string,
): Promise<{ email: string } | null> {
  const res = await fetch(
    `${env.supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=email`,
    {
      headers: {
        apikey: env.serviceRoleKey,
        authorization: `Bearer ${env.serviceRoleKey}`,
      },
    },
  );
  if (!res.ok) {
    throw new ApiError(500, "INTERNAL_ERROR", "Could not look up the account.");
  }
  const rows = (await res.json()) as { email: string }[];
  return rows.length > 0 ? rows[0] : null;
}

async function deleteAuthUser(env: AuthEnv, userId: string): Promise<void> {
  await fetch(`${env.supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      apikey: env.serviceRoleKey,
      authorization: `Bearer ${env.serviceRoleKey}`,
    },
  });
}

// Reads the caller's own profile row using their token. RLS on the profiles
// table only lets a player see (and update) their own row.
async function fetchOwnProfile(
  env: AuthEnv,
  accessToken: string,
): Promise<Profile | null> {
  const res = await fetch(
    `${env.supabaseUrl}/rest/v1/profiles?select=id,username,character&limit=1`,
    {
      headers: {
        apikey: env.anonKey,
        authorization: `Bearer ${accessToken}`,
      },
    },
  );
  if (res.status === 401 || res.status === 403) {
    throw unauthorized();
  }
  if (!res.ok) {
    throw new ApiError(
      500,
      "INTERNAL_ERROR",
      "Could not load your profile.",
    );
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0
    ? (rows[0] as Profile)
    : null;
}

async function updateOwnCharacter(
  env: AuthEnv,
  accessToken: string,
  character: string,
): Promise<Profile> {
  // Confirms the token is valid and gives us the row id for the PATCH filter.
  const profile = await fetchOwnProfile(env, accessToken);
  if (!profile) {
    throw unauthorized();
  }
  const res = await fetch(
    `${env.supabaseUrl}/rest/v1/profiles?id=eq.${profile.id}`,
    {
      method: "PATCH",
      headers: {
        apikey: env.anonKey,
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({ character }),
    },
  );
  if (res.status === 401 || res.status === 403) {
    throw unauthorized();
  }
  if (!res.ok) {
    throw new ApiError(
      500,
      "INTERNAL_ERROR",
      "Could not save your character.",
    );
  }
  const rows = (await res.json()) as Profile[];
  return rows[0];
}

// Signs in with the supplied credentials and returns the created session.
async function exchangeCredentialsForSession(
  env: AuthEnv,
  email: string,
  password: string,
): Promise<UserSession> {
  const { status, json } = await goTrue(env, "/token?grant_type=password", {
    method: "POST",
    body: { email, password },
    key: env.anonKey,
  });
  if (status !== 200) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Wrong username or password.",
    );
  }
  const accessToken = json.access_token;
  const refreshToken = json.refresh_token;
  const user = json.user as { id?: string; email?: string } | undefined;
  if (
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string" ||
    !user ||
    typeof user.id !== "string" ||
    typeof user.email !== "string"
  ) {
    throw new ApiError(500, "INTERNAL_ERROR", "Could not start a session.");
  }
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email },
  };
}

export function supabaseAuthProvider(env: AuthEnv): AuthProvider {
  return {
    async signUp(input) {
      const signUpResponse = await goTrue(env, "/signup", {
        method: "POST",
        body: {
          email: input.email,
          password: input.password,
          data: {
            username: input.username,
            gender: input.gender ?? "",
            year_level: input.yearLevel ?? "",
          },
        },
        key: env.anonKey,
      });
      if (signUpResponse.status < 200 || signUpResponse.status >= 300) {
        const code = signUpResponse.json.code;
        if (code === "user_already_exists") {
          throw new ApiError(
            409,
            "EMAIL_TAKEN",
            "That email is already registered.",
          );
        }
        throw new ApiError(400, "SIGN_UP_FAILED", "Could not create the account.");
      }
      const created = signUpResponse.json.user as
        | { id?: string; email?: string }
        | undefined;
      if (!created || typeof created.id !== "string" || typeof created.email !== "string") {
        throw new ApiError(500, "INTERNAL_ERROR", "Could not create the account.");
      }

      // Store the public profile. A unique-username violation comes back as 409.
      const profile = await postgrest(env, "/profiles", {
        id: created.id,
        username: input.username,
        email: created.email,
        gender: input.gender ?? "",
        year_level: input.yearLevel ?? "",
        privacy_consent: input.privacyConsent,
      });
      if (profile.status === 409) {
        // Undo the auth user so no orphan account is left behind.
        await deleteAuthUser(env, created.id);
        throw new ApiError(
          409,
          "USERNAME_TAKEN",
          "That username is already taken.",
        );
      }
      if (profile.status >= 300) {
        await deleteAuthUser(env, created.id);
        throw new ApiError(500, "INTERNAL_ERROR", "Could not save the profile.");
      }

      return await exchangeCredentialsForSession(
        env,
        created.email,
        input.password,
      );
    },

    async signIn(username, password) {
      const profile = await getProfileByUsername(env, username);
      if (!profile) {
        throw new ApiError(
          401,
          "INVALID_CREDENTIALS",
          "Wrong username or password.",
        );
      }
      return await exchangeCredentialsForSession(env, profile.email, password);
    },

    async getProfile(accessToken) {
      const profile = await fetchOwnProfile(env, accessToken);
      if (!profile) {
        throw unauthorized();
      }
      return profile;
    },

    async setCharacter(accessToken, character) {
      return await updateOwnCharacter(env, accessToken, character);
    },
  };
}