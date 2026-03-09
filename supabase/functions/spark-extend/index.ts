import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";


const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validDays = [1, 3, 7];

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();

    // Validate inputs
    const spark_id = typeof body.spark_id === "string" ? body.spark_id.trim() : "";
    if (!uuidRegex.test(spark_id)) {
      return new Response(JSON.stringify({ error: "Invalid spark_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const days = Number(body.days);
    if (!validDays.includes(days)) {
      return new Response(JSON.stringify({ error: "Days must be 1, 3, or 7" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify user is member of this spark
    const { data: spark, error: sparkError } = await supabase
      .from("sparks")
      .select("*")
      .eq("id", spark_id)
      .single();

    if (sparkError || !spark) {
      return new Response(JSON.stringify({ error: "Spark not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (spark.user_a !== user.id && spark.user_b !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine token cost
    const tokenCost = days === 1 ? 1 : days === 3 ? 2 : 4;
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    const isFreeWithPass = profile?.subscription_tier !== "free";
    const actualCost = isFreeWithPass ? 0 : tokenCost;

    // Atomically deduct tokens via RPC (prevents race conditions)
    if (actualCost > 0) {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { error: deductErr } = await adminClient.rpc("deduct_tokens", {
        p_user_id: user.id,
        p_cost: actualCost,
      });
      if (deductErr) {
        return new Response(
          JSON.stringify({ error: "Insufficient tokens" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      await adminClient.from("token_transactions").insert({ user_id: user.id, amount: -actualCost, reason: `Spark extension: ${days} days` });
    }

    // Extend spark expiry
    const currentExpiry = spark.expires_at ? new Date(spark.expires_at) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

    await supabase.from("sparks").update({ expires_at: newExpiry.toISOString() }).eq("id", spark_id);

    return new Response(
      JSON.stringify({ success: true, new_expiry: newExpiry.toISOString(), tokens_spent: actualCost }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
