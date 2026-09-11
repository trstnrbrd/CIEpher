import type { ErrorHandler, NotFoundHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

// Every error the API sends has this shape: { error: { code, message } }.
// `code` is for the frontend's logic; `message` must be safe to show players.
export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

// Throw this from any route for errors players are allowed to see.
export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const handleError: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) {
    return c.json(errorBody(err.code, err.message), err.status);
  }
  // Anything else is a bug: log the details, show the player a generic message.
  console.error(err);
  return c.json(
    errorBody("INTERNAL_ERROR", "Something went wrong. Please try again."),
    500,
  );
};

export const handleNotFound: NotFoundHandler = (c) => {
  return c.json(errorBody("NOT_FOUND", "That route doesn't exist."), 404);
};
