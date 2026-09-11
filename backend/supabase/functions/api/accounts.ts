import { createClient } from "@supabase/supabase-js";
import { ApiError } from "./errors.ts";
import type { LoginInput, RegisterInput } from "./schemas.ts";

export type Profile = {
  id: string;
  username: string;
  character: "boy" | "girl" | null;
};
export type Session = { accessToken: string; refreshToken: string };
export type AuthResult = { session: Session; profile: Profile };

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
        if (cleanupError)
          console.error("register cleanup failed", cleanupError);
        if (profileError.code === "23505") {
          throw new ApiError(
            409,
            "USERNAME_TAKEN",
            "That username is already taken.",
          );
        }
        throw profileError;
      }

      // 3. Log the new player in.
      const { session } = await signIn(config, email, password);
      return { session, profile };
    },

    async login({ username, password }) {
      // 1. Find the email for this username. Only the API can call this
      // database function (see the login_email_lookup migration).
      const { data: email, error: lookupError } = await admin.rpc(
        "login_email_for_username",
        { p_username: username },
      );
      if (lookupError) throw lookupError;
      // Unknown username: the same error as a wrong password, on purpose,
      // so nobody can find out which usernames exist.
      if (!email) throw invalidCredentials();

      // 2. Supabase Auth checks the password.
      const { session, userId } = await signIn(config, email, password);

      // 3. Load the player's profile.
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id, username, character")
        .eq("id", userId)
        .single();
      if (profileError) throw profileError;
      return { session, profile };
    },
  };
}

async function signIn(
  config: SupabaseConfig,
  email: string,
  password: string,
): Promise<{ session: Session; userId: string }> {
  // A fresh client for every sign-in, so sessions never mix between players.
  const client = createClient(config.url, config.anonKey, serverOptions);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error?.code === "invalid_credentials") throw invalidCredentials();
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
