import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { getCorsHeaders } from "../_shared/cors.ts";


Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth gate: service_role only — this is an admin/setup operation
    const authHeader = req.headers.get("Authorization");
    const expectedServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!authHeader?.startsWith("Bearer ") || !expectedServiceKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    if (token !== expectedServiceKey) {
      return new Response(
        JSON.stringify({ error: "Forbidden — service_role only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAdmin = createClient(supabaseUrl, expectedServiceKey);

    // Check if keys already exist
    const { data: existing } = await supabaseAdmin
      .from("app_config")
      .select("value_json")
      .eq("key", "vapid_public_key")
      .maybeSingle();

    if (existing?.value_json) {
      return new Response(
        JSON.stringify({ message: "VAPID keys already configured", publicKey: existing.value_json }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate VAPID keys
    const vapidKeys = webpush.generateVAPIDKeys();

    // Store public key in app_config for frontend access
    await supabaseAdmin.from("app_config").upsert({
      key: "vapid_public_key",
      value_json: vapidKeys.publicKey,
    });

    return new Response(
      JSON.stringify({
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey,
        message: "Store both keys as secrets: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
