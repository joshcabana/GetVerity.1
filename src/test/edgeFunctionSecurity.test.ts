import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const FUNCTIONS_DIR = join(__dirname, "../../supabase/functions");

/** Read an edge function's source */
function readFunc(name: string): string {
  return readFileSync(join(FUNCTIONS_DIR, name, "index.ts"), "utf-8");
}

/** Get all edge function directories (exclude _shared) */
function listFunctions(): string[] {
  return readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);
}

describe("Edge Function Security", () => {
  const allFunctions = listFunctions();

  describe("CORS", () => {
    // stripe-webhook is called server-to-server by Stripe, not from browsers
    const NO_CORS_NEEDED = new Set(["stripe-webhook"]);

    it("all browser-facing edge functions import getCorsHeaders from shared module", () => {
      for (const fn of allFunctions) {
        if (NO_CORS_NEEDED.has(fn)) continue;
        const src = readFunc(fn);
        expect(src, `${fn} must import getCorsHeaders`).toContain("getCorsHeaders");
        expect(src, `${fn} must not use wildcard CORS`).not.toMatch(
          /Access-Control-Allow-Origin.*\*/
        );
      }
    });

    it("stripe-webhook does not expose CORS headers (server-to-server)", () => {
      const src = readFunc("stripe-webhook");
      expect(src).not.toContain("Access-Control-Allow-Origin");
    });
  });

  describe("Authentication", () => {
    // Functions that are intentionally unauthenticated:
    // - agora-demo-token (public demo, rate-limited by IP)
    // - get-feature-flags (public config, read-only)
    // - stripe-webhook (Stripe signature verification instead of JWT)
    const PUBLIC_FUNCTIONS = new Set([
      "agora-demo-token",
      "get-feature-flags",
      "stripe-webhook",
    ]);

    it("all non-public edge functions check Authorization header", () => {
      for (const fn of allFunctions) {
        if (PUBLIC_FUNCTIONS.has(fn)) continue;
        const src = readFunc(fn);
        expect(src, `${fn} must check Authorization header`).toMatch(
          /Authorization/
        );
      }
    });

    it("service-role-only functions verify the token matches service key", () => {
      const serviceRoleOnly = ["aggregate-stats", "generate-vapid-keys"];
      for (const fn of serviceRoleOnly) {
        const src = readFunc(fn);
        expect(src, `${fn} must compare token to service key`).toContain(
          "service_role"
        );
      }
    });
  });

  describe("Error Message Safety", () => {
    it("no edge function exposes raw error.message to clients", () => {
      for (const fn of allFunctions) {
        const src = readFunc(fn);
        // Ignore console.error lines — those are server-side logging, not client responses
        const responseLines = src
          .split("\n")
          .filter(
            (line) =>
              line.includes("new Response") ||
              line.includes("JSON.stringify({ error")
          );

        for (const line of responseLines) {
          expect(
            line,
            `${fn} must not expose error.message in response: ${line.trim()}`
          ).not.toMatch(/error\.(message|stack)/);
          expect(
            line,
            `${fn} must not expose String(err) in response: ${line.trim()}`
          ).not.toMatch(/String\(err/);
        }
      }
    });
  });

  describe("Rate Limiting", () => {
    const RATE_LIMITED = [
      "find-match",
      "agora-token",
      "agora-demo-token",
      "create-checkout",
      "submit-appeal",
      "spark-reflection-ai",
    ];

    it("sensitive endpoints use rate limiting", () => {
      for (const fn of RATE_LIMITED) {
        const src = readFunc(fn);
        expect(src, `${fn} must import rateLimit`).toContain("rateLimit");
      }
    });
  });

  describe("Input Validation", () => {
    const UUID_VALIDATED = [
      "agora-token",
      "start-cloud-recording",
      "stop-cloud-recording",
      "generate-friend-invite",
      "generate-replay",
      "spark-reflection-ai",
    ];

    it("functions receiving UUIDs validate them with regex", () => {
      for (const fn of UUID_VALIDATED) {
        const src = readFunc(fn);
        expect(src, `${fn} must validate UUIDs`).toMatch(/uuidRegex|uuid.*regex/i);
      }
    });

    it("admin-moderation validates and truncates string inputs", () => {
      const src = readFunc("admin-moderation");
      expect(src).toContain(".trim()");
      expect(src).toContain(".slice(0,");
    });

    it("submit-appeal validates explanation length", () => {
      const src = readFunc("submit-appeal");
      expect(src).toContain("explanation.length");
    });
  });
});
