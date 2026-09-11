import { Hono } from "hono";
import { cors } from "hono/cors";
import { handleError, handleNotFound } from "./errors.ts";

export type AppConfig = {
  // Websites allowed to call this API from a browser, e.g. Vhan's local Vite app.
  allowedOrigins: string[];
};

// Builds the whole API. Settings come in as arguments (not read from the
// environment here), so tests can create an app with any settings they need.
export function createApp({ allowedOrigins }: AppConfig) {
  const app = new Hono().basePath("/api");

  app.use(
    "*",
    cors({
      origin: allowedOrigins,
      allowHeaders: [
        "authorization",
        "x-client-info",
        "apikey",
        "content-type",
      ],
      allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    }),
  );

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.notFound(handleNotFound);
  app.onError(handleError);

  return app;
}
