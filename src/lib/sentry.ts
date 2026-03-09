/**
 * Lazy Sentry loader.
 *
 * Sentry is dynamically imported to keep it off the critical rendering path.
 * The 454 KB bundle loads after the app has hydrated, so users see content
 * faster while still getting full error monitoring.
 *
 * The DSN is read from VITE_SENTRY_DSN. When absent (local dev, or not yet
 * configured in Lovable), Sentry silently no-ops — no errors, no network calls.
 *
 * To activate:
 *   1. Create a Sentry project at https://sentry.io
 *   2. Add VITE_SENTRY_DSN=<your-dsn> to your Lovable project's environment variables
 */

let sentryModule: typeof import("@sentry/react") | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Lazily initialize Sentry. Returns a promise that resolves when the module
 * is loaded and configured (or immediately if DSN is not set).
 */
export function initSentry(): Promise<void> {
  if (initPromise) return initPromise;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    initPromise = Promise.resolve();
    return initPromise;
  }

  initPromise = import("@sentry/react").then((mod) => {
    sentryModule = mod;
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      release: `verity@${import.meta.env.VITE_APP_VERSION ?? "0.0.0"}`,

      // Only capture errors, not performance traces (keep overhead minimal)
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
  });

  return initPromise;
}

/**
 * Proxy object that safely calls Sentry methods whether or not the module
 * has loaded yet. If Sentry hasn't initialized, calls are silently no-ops.
 */
export const Sentry = {
  captureException(error: unknown) {
    if (sentryModule) {
      sentryModule.captureException(error);
    } else {
      // Queue capture for after init
      initSentry().then(() => sentryModule?.captureException(error));
    }
  },
  captureMessage(message: string, level?: "warning" | "error" | "info") {
    if (sentryModule) {
      sentryModule.captureMessage(message, level);
    } else {
      initSentry().then(() => sentryModule?.captureMessage(message, level));
    }
  },
  withScope(callback: (scope: any) => void) {
    if (sentryModule) {
      sentryModule.withScope(callback);
    } else {
      initSentry().then(() => sentryModule?.withScope(callback));
    }
  },
};
