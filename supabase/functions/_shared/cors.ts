/**
 * Shared CORS configuration for all Verity edge functions.
 *
 * Usage:
 *   import { getCorsHeaders, ALLOWED_ORIGINS } from "../_shared/cors.ts";
 *
 *   // In your handler:
 *   const corsHeaders = getCorsHeaders(req);
 *   if (req.method === "OPTIONS") {
 *     return new Response(null, { headers: corsHeaders });
 *   }
 */

export const ALLOWED_ORIGINS = [
  "https://getverity.com.au",
  "https://spark-echo-verity.lovable.app",
  "https://id-preview--a81e90ba-a208-41e2-bf07-a3adfb94bfcb.lovable.app",
];

const CORS_ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

/**
 * Returns CORS headers with the origin restricted to ALLOWED_ORIGINS.
 * Falls back to the first allowed origin when the request origin is not allowlisted.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const safeOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": safeOrigin,
    "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
    "Vary": "Origin",
  };
}
