import * as Sentry from "@sentry/deno";
import type { ReportError } from "./errors.ts";

// Supabase's edge runtime global for work that finishes after the response.
// Declared here rather than taken from index.ts's type import, and checked
// before use, so this file also loads outside the edge runtime.
declare const EdgeRuntime:
  { waitUntil(promise: Promise<unknown>): void } | undefined;

// Error monitoring: the API's bugs (its 500s) go to Sentry, which emails us.
// Off unless SENTRY_DSN is set, so local development and tests send nothing.
export function sentryReporter(
  dsn: string | undefined,
  environment: string,
): ReportError | undefined {
  if (!dsn) return undefined;

  Sentry.init({
    dsn,
    environment,
    // Supabase's guide: Sentry's automatic hooks don't suit Edge Functions.
    defaultIntegrations: false,
    // Errors only, no performance tracing.
    tracesSampleRate: 0,
    // Never send personal data. On top of that, drop anything about the
    // request or the player before an event leaves the server.
    sendDefaultPii: false,
    beforeSend(event) {
      delete event.request;
      delete event.user;
      delete event.breadcrumbs;
      return event;
    },
    // Which Supabase region and function instance the error came from.
    initialScope: {
      tags: {
        region: Deno.env.get("SB_REGION") ?? "unknown",
        execution_id: Deno.env.get("SB_EXECUTION_ID") ?? "unknown",
      },
    },
  });

  return (error, { route }) => {
    // Edge Functions share one Sentry scope between requests, so the route
    // travels with this one event instead of being set globally.
    Sentry.captureException(error, { tags: { route } });
    // Send it in the background, after the player already has their answer.
    const sending = Sentry.flush(2000);
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(sending);
  };
}
