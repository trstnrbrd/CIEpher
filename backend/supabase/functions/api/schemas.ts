import { z } from "zod";
import { ApiError } from "./errors.ts";

// What each endpoint accepts. These rules must match the database (profiles
// table) and Supabase Auth's settings (config.toml), and Documents/api-contract.md.

export const registerSchema = z.object({
  username: z
    .string({ error: "Username is required." })
    .trim()
    .regex(
      /^[A-Za-z0-9_]{3,20}$/,
      "Username must be 3-20 letters, numbers, or underscores.",
    ),
  email: z
    .email({ error: "That email doesn't look valid." })
    .max(254, "That email is too long."),
  password: z
    .string({ error: "Password is required." })
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters.")
    .regex(/[A-Za-z]/, "Password must include a letter and a number.")
    .regex(/[0-9]/, "Password must include a letter and a number."),
  privacyConsent: z.literal(true, {
    error: "You must agree to the privacy notice.",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login only checks that both fields are there. Whether they're right is
// decided by Supabase Auth, with one generic error for either mistake.
export const loginSchema = z.object({
  username: z
    .string({ error: "Username is required." })
    .trim()
    .min(1, "Username is required.")
    .max(50, "Username is too long."),
  password: z
    .string({ error: "Password is required." })
    .min(1, "Password is required.")
    .max(72, "Password is too long."),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Checks a request body against a schema. If it's invalid, throws a 400 that
// names the first wrong field, so the frontend can highlight it.
export function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.map(String).join(".") || undefined;
    throw new ApiError(400, "VALIDATION_ERROR", issue.message, field);
  }
  return result.data;
}
