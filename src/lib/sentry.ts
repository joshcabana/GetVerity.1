import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry error monitoring.
 *
 * The DSN is read from VITE_SENTRY_DSN. When absent (local dev, or not yet
 * configured in Lovable), Sentry silently no-ops — no errors, no network calls.
 *
 * To activate:
 *   1. Create a Sentry project at https://sentry.io
 *   2. Add VITE_SENTRY_DSN=<your-dsn> to your Lovable project's environment variables
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    // Sentry is optional — skip silently when DSN is not configured
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: `verity@${import.meta.env.VITE_APP_VERSION ?? "0.0.0"}`,

    // Only capture errors, not performance traces (keep bundle & overhead minimal)
    tracesSampleRate: 0,

    // Sample 100% of errors in production (adjust if volume gets high)
    sampleRate: 1.0,

    // Filter out noisy browser extension and third-party errors
    beforeSend(event) {
      const frames = event.exception?.values?.[0]?.stacktrace?.frames;
      if (frames?.some((f) => f.filename?.includes("extension://"))) {
        return null; // Drop browser extension errors
      }
      return event;
    },

    // Don't send PII by default
    sendDefaultPii: false,
  });
}

export { Sentry };
