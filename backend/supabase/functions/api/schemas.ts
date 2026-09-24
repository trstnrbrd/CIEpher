import { z } from "zod";
import { ApiError } from "./errors.ts";

// What each endpoint accepts. These rules must match the database (profiles
// table) and Supabase Auth's settings (config.toml), and Documents/api-contract.md.

// The token from the "I'm not a robot" widget, sent with register and forgot
// password. Required only while the check is switched on (humanCheck in
// app.ts).
const turnstileToken = z
  .string({ error: "The robot check token must be text." })
  .max(2048, "The robot check token is too long.")
  .optional();

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
  turnstileToken,
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
// It's also behind the robot check, so a script can't use it to flood
// inboxes or use up the hourly email limit.
export const forgotPasswordSchema = loginSchema
  .pick({ username: true })
  .extend({ turnstileToken });

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
// question number is optional. Whether the answer is right is decided by
// csharp.ts, not here. The answer is kept exactly as typed, spaces included:
// the positions of its mistakes count from it.
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
    .int({ error: "Question must be a whole number from 1 to 10." })
    .min(1, "Question must be a whole number from 1 to 10.")
    // The epilogue exam is one mission with 10 items.
    .max(10, "Question must be a whole number from 1 to 10.")
    .default(1),
  answer: z
    .string({ error: "Type your answer first." })
    .max(500, "That answer is too long.")
    .refine((answer) => answer.trim() !== "", "Type your answer first.")
    // Postgres text cannot hold a 0 byte, and the answer is stored now
    // (mission_attempts). Nobody can type one, but a script can send it,
    // and without this it reaches the database and becomes a 500.
    .refine(
      (answer) => !answer.includes("\u0000"),
      "That answer has a character we can't read. Please type it again.",
    ),
});

export type SubmitInput = z.infer<typeof submitSchema>;

// One item of the epilogue exam. There is only one exam, so the chapter and
// mission are not sent: the server knows which mission it is (exam.ts). The
// reply never says whether the answer was right.
export const examAnswerSchema = submitSchema.pick({
  question: true,
  answer: true,
});

export type ExamAnswerInput = z.infer<typeof examAnswerSchema>;

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
