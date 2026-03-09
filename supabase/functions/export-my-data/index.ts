import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Rate limit: 5 exports per hour per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`export-data:${ip}`, 5, 3_600_000)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }
  const userId = claimsData.claims.sub as string;

  // Gather all user-owned data
  const [profile, trust, sparks, messages, reflections, vault, reports, appeals, transactions] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId),
      supabase.from("user_trust").select("*").eq("user_id", userId),
      supabase.from("sparks").select("id, call_id, created_at, is_archived, ai_insight, voice_intro_a, voice_intro_b, user_a, user_b").or(`user_a.eq.${userId},user_b.eq.${userId}`),
      supabase.from("messages").select("id, content, created_at, is_read, is_voice, spark_id").eq("sender_id", userId),
      supabase.from("spark_reflections").select("*").eq("user_id", userId),
      supabase.from("chemistry_vault_items").select("*").eq("user_id", userId),
      supabase.from("reports").select("id, reason, created_at, status").eq("reporter_id", userId),
      supabase.from("appeals").select("id, explanation, status, created_at").eq("user_id", userId),
      supabase.from("token_transactions").select("*").eq("user_id", userId),
    ]);

  // Redact partner info from sparks
  const redactedSparks = (sparks.data ?? []).map((s: Record<string, unknown>) => ({
    id: s.id,
    call_id: s.call_id,
    created_at: s.created_at,
    is_archived: s.is_archived,
    ai_insight: s.ai_insight,
    role: s.user_a === userId ? "user_a" : "user_b",
  }));

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profile.data?.[0] ?? null,
    trust: trust.data?.[0] ?? null,
    sparks: redactedSparks,
    messages_sent: messages.data ?? [],
    reflections: reflections.data ?? [],
    vault_items: vault.data ?? [],
    reports_filed: reports.data ?? [],
    appeals: appeals.data ?? [],
    token_transactions: transactions.data ?? [],
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="verity-data-export.json"',
    },
  });
});
