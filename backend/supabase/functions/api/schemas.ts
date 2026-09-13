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
    // Supabase Auth (bcrypt) counts bytes, not characters: an accented or
    // multibyte password of 72 characters could be rejected as "too weak".
    // Match GoTrue exactly so validation and storage agree.
    .refine(
      (password) => new TextEncoder().encode(password).length <= 72,
      "Password is too long.",
    )
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

// "Forgot password?": the player gives the username they log in with.
export const forgotPasswordSchema = loginSchema.pick({ username: true });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// The two characters on the Character Select screen.
export const characterSchema = z.object({
  character: z.enum(["boy", "girl"], {
    error: 'Character must be "boy" or "girl".',
  }),
});

export type Character = z.infer<typeof characterSchema>["character"];

// An answer typed into a mission's challenge (chapter 0 is the prologue).
// Most missions ask one question; some ask more (numbered from 1), so the
// question number is optional. Whether the answer is right is decided by the
// database, not here.
export const submitSchema = z.object({
  chapter: z
    .int({ error: "Chapter must be a whole number from 0 to 99." })
    .min(0, "Chapter must be a whole number from 0 to 99.")
    .max(99, "Chapter must be a whole number from 0 to 99."),
  mission: z
    .int({ error: "Mission must be a whole number from 1 to 99." })
    .min(1, "Mission must be a whole number from 1 to 99.")
    .max(99, "Mission must be a whole number from 1 to 99."),
  question: z
    .int({ error: "Question must be a whole number from 1 to 9." })
    .min(1, "Question must be a whole number from 1 to 9.")
    .max(9, "Question must be a whole number from 1 to 9.")
    .default(1),
  answer: z
    .string({ error: "Type your answer first." })
    .trim()
    .min(1, "Type your answer first.")
    .max(500, "That answer is too long."),
});

export type SubmitInput = z.infer<typeof submitSchema>;

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
