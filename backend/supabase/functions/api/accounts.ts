import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./errors.ts";
import type { LoginInput, RegisterInput } from "./schemas.ts";

export type Profile = {
  id: string;
  username: string;
  character: "boy" | "girl" | null;
};
export type Session = { accessToken: string; refreshToken: string };
// Register never logs the player in (the client's flow sends them back to the
// login screen), so its session is always null. Login always has one.
export type AuthResult = { session: Session | null; profile: Profile };

// Everything the routes need for player accounts. Routes depend on this type,
// not on Supabase directly, so tests can pass a fake instead.
export type Accounts = {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
};

export type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

// Server code must never save or auto-refresh sessions.
const serverOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
};

export function supabaseAccounts(config: SupabaseConfig): Accounts {
  // Full access that skips RLS. Only for what players can't do themselves:
  // creating accounts and profiles. Never leaves the server.
  const admin = createClient(config.url, config.serviceRoleKey, serverOptions);

  return {
    async register({ username, email, password }) {
      // 1. Create the login account in Supabase Auth.
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // no email verification yet (open question 7)
        });
      if (createError?.code === "email_exists") {
        throw new ApiError(
          409,
          "EMAIL_TAKEN",
          "That email is already registered.",
        );
      }
      if (createError?.code === "weak_password") {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "That password is too weak.",
          "password",
        );
      }
      if (createError) throw createError;
      const userId = created.user.id;

      // 2. Save the profile. The database's unique index decides whether the
      // username is taken (it also catches two players registering at once).
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .insert({
          id: userId,
          username,
          privacy_consent_at: new Date().toISOString(),
        })
        .select("id, username, character")
        .single();
      if (profileError) {
        // Never leave a login account without a profile behind.
        const { error: cleanupError } =
          await admin.auth.admin.deleteUser(userId);
        if (cleanupError) {
          console.error("register cleanup failed", cleanupError);
        }
        if (profileError.code === "23505") {
          throw new ApiError(
            409,
            "USERNAME_TAKEN",
            "That username is already taken.",
          );
        }
        throw profileError;
      }

      // Not logged in on purpose: the player signs in on the login screen.
      return { session: null, profile };
    },

    async login({ username, password }) {
      // 1. Refuse while this username is locked, even with the right
      // password, so guessing can't continue (see login_failures migration).
      await refuseIfLocked(admin, username);

      // 2. Find the email for this username. Only the API can call this
      // database function (see the login_email_lookup migration).
      const { data: email, error: lookupError } = await admin.rpc(
        "login_email_for_username",
        { p_username: username },
      );
      if (lookupError) throw lookupError;
      // Unknown usernames count as a wrong password too, with the same
      // error, so nobody can find out which usernames exist.
      if (!email) throw await recordWrongPassword(admin, username);

      // 3. Supabase Auth checks the password.
      const signedIn = await signIn(config, email, password);
      if (!signedIn) throw await recordWrongPassword(admin, username);

      // 4. Correct password: forget any earlier wrong ones.
      const { error: clearError } = await admin.rpc("clear_login_failures", {
        p_username: username,
      });
      if (clearError) throw clearError;

      // 5. Load the player's profile.
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id, username, character")
        .eq("id", signedIn.userId)
        .single();
      if (profileError) throw profileError;
      return { session: signedIn.session, profile };
    },
  };
}

// Throws a 429 while the username is locked.
async function refuseIfLocked(
  admin: SupabaseClient,
  username: string,
): Promise<void> {
  const { data: lockedSeconds, error } = await admin.rpc("login_lock_seconds", {
    p_username: username,
  });
  if (error) throw error;
  if (lockedSeconds > 0) throw tooManyAttempts(lockedSeconds);
}

// Counts a wrong password (or unknown username) and returns the error to send:
// 401 normally, or 429 if this attempt just locked the username.
async function recordWrongPassword(
  admin: SupabaseClient,
  username: string,
): Promise<ApiError> {
  const { data: lockedSeconds, error } = await admin.rpc(
    "record_login_failure",
    { p_username: username },
  );
  if (error) throw error;
  if (lockedSeconds > 0) {
    // No username in the log: it's personal data.
    console.warn("login: a username was locked after too many wrong passwords");
    return tooManyAttempts(lockedSeconds);
  }
  return invalidCredentials();
}

// Returns null when the password is wrong.
async function signIn(
  config: SupabaseConfig,
  email: string,
  password: string,
): Promise<{ session: Session; userId: string } | null> {
  // A fresh client for every sign-in, so sessions never mix between players.
  const client = createClient(config.url, config.anonKey, serverOptions);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error?.code === "invalid_credentials") return null;
  if (error?.code === "over_request_rate_limit") {
    throw new ApiError(
      429,
      "TOO_MANY_ATTEMPTS",
      "Too many attempts. Please wait a few minutes and try again.",
    );
  }
  if (error) throw error;
  return {
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
    userId: data.user.id,
  };
}

function invalidCredentials() {
  return new ApiError(
    401,
    "INVALID_CREDENTIALS",
    "Wrong username or password.",
  );
}

function tooManyAttempts(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return new ApiError(
    429,
    "TOO_MANY_ATTEMPTS",
    `Too many failed attempts. Try again in ${minutes} minute${
      minutes === 1 ? "" : "s"
    }.`,
  );
}
