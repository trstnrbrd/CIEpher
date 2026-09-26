import type { ErrorHandler, NotFoundHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

// Every error the API sends has this shape: { error: { code, message, field? } }.
// `code` is for the frontend's logic; `message` must be safe to show players;
// `field` (validation errors only) names the input that's wrong.
export function errorBody(code: string, message: string, field?: string) {
  return { error: { code, message, ...(field ? { field } : {}) } };
}

// Throw this from any route for errors players are allowed to see.
export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

// The database refuses an answer with this SQLSTATE when a player sends more
// than 30 a minute (the answer_rate_limit migration). It's the speed limit
// working, not a bug, so it becomes a 429 instead of a 500.
export function answerLimitError(error: { code?: string }): ApiError | null {
  return error.code === "PT429"
    ? new ApiError(
        429,
        "TOO_MANY_ANSWERS",
        "You're answering too fast. Wait a moment, then try again.",
      )
    : null;
}

// Sends a bug to error monitoring (Sentry in index.ts, a fake in tests).
// Gets only the error and the route: never the request body, headers or player.
export type ReportError = (error: unknown, context: { route: string }) => void;

export function errorHandler(reportError?: ReportError): ErrorHandler {
  return (err, c) => {
    if (err instanceof ApiError) {
      return c.json(errorBody(err.code, err.message, err.field), err.status);
    }
    // Anything else is a bug: log and report the details, show the player a
    // generic message.
    console.error(err);
    try {
      reportError?.(err, { route: `${c.req.method} ${c.req.path}` });
    } catch (reportFailure) {
      // A broken reporter must never break the player's error message.
      console.error("Error report failed:", reportFailure);
    }
    return c.json(
      errorBody("INTERNAL_ERROR", "Something went wrong. Please try again."),
      500,
    );
  };
}

export const handleNotFound: NotFoundHandler = (c) => {
  return c.json(errorBody("NOT_FOUND", "That route doesn't exist."), 404);
};
