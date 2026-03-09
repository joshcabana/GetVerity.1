import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rate-limit.ts";


const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const urlRegex = /^https?:\/\/.{1,2000}$/;

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

    // Rate limit: 3 appeals per minute per user
    if (!rateLimit(`submit-appeal:${user.id}`, 3)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();

    // Validate inputs
    const explanation = typeof body.explanation === "string" ? body.explanation.trim() : "";
    if (explanation.length < 10 || explanation.length > 2000) {
      return new Response(JSON.stringify({ error: "Explanation must be 10-2000 characters" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const voice_note_url = body.voice_note_url ? String(body.voice_note_url).trim() : null;
    if (voice_note_url && !urlRegex.test(voice_note_url)) {
      return new Response(JSON.stringify({ error: "Invalid voice note URL" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const flag_id = body.flag_id ? String(body.flag_id).trim() : null;
    if (flag_id && !uuidRegex.test(flag_id)) {
      return new Response(JSON.stringify({ error: "Invalid flag_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data, error } = await supabase
      .from("appeals")
      .insert({
        user_id: user.id,
        explanation,
        voice_note_url,
        flag_id,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, appeal: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
