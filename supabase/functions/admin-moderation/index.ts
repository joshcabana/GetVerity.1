import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";


const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validActions = ["approve", "deny"];

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

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();

    // Validate inputs
    const appeal_id = typeof body.appeal_id === "string" ? body.appeal_id.trim() : "";
    if (!uuidRegex.test(appeal_id)) {
      return new Response(JSON.stringify({ error: "Invalid appeal_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const action = typeof body.action === "string" ? body.action.trim() : "";
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: "Action must be 'approve' or 'deny'" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const response = typeof body.response === "string" ? body.response.trim().slice(0, 2000) : "";

    const { data, error } = await supabase
      .from("appeals")
      .update({
        status: action === "approve" ? "upheld" : "denied",
        admin_response: response || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", appeal_id)
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
