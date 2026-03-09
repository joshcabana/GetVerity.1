import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";


serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { call_id, feeling_score, liked_text, next_time_text } = await req.json();

    if (!call_id) {
      return new Response(JSON.stringify({ error: "call_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is a participant in the call
    const { data: call, error: callErr } = await supabase
      .from("calls")
      .select("id, caller_id, callee_id")
      .eq("id", call_id)
      .single();

    if (callErr || !call) {
      return new Response(JSON.stringify({ error: "Call not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (call.caller_id !== userId && call.callee_id !== userId) {
      return new Response(JSON.stringify({ error: "Not a participant" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const partnerId = call.caller_id === userId ? call.callee_id : call.caller_id;

    // Call Lovable AI for reflection
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiReflection = "";

    if (LOVABLE_API_KEY) {
      const systemPrompt = `You are a warm, empathetic dating coach. A user just finished a 45-second anonymous video call on a dating app called Verity. Based on their self-reflection, generate a brief, encouraging insight (3-4 sentences max). Include: one strength they showed, one gentle suggestion for next time, and a suggested conversation theme for their next call. Keep it personal, warm, and actionable. Do not use emojis. Do not reference the app name.`;

      const userPrompt = `Feeling score: ${feeling_score || "not provided"}/5
What they liked: ${liked_text || "not provided"}
What they'd try next time: ${next_time_text || "not provided"}`;

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          aiReflection = aiData.choices?.[0]?.message?.content || "";
        } else {
          const errText = await aiResp.text();
          console.error("AI gateway error:", aiResp.status, errText);
        }
      } catch (e) {
        console.error("AI call failed:", e);
      }
    }

    // Insert reflection using service role to bypass RLS for upsert
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: reflection, error: refErr } = await serviceClient
      .from("spark_reflections")
      .upsert(
        {
          call_id,
          user_id: userId,
          feeling_score: feeling_score || null,
          liked_text: liked_text || null,
          next_time_text: next_time_text || null,
          ai_reflection: aiReflection || null,
        },
        { onConflict: "call_id,user_id" }
      )
      .select("id")
      .single();

    if (refErr) {
      console.error("Failed to insert reflection:", refErr);
      return new Response(JSON.stringify({ error: "Failed to save reflection" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-create chemistry vault item
    const { error: vaultErr } = await serviceClient
      .from("chemistry_vault_items")
      .upsert(
        {
          call_id,
          user_id: userId,
          partner_user_id: partnerId,
          title: `Spark Session`,
          reflection_id: reflection.id,
        },
        { onConflict: "call_id,user_id" }
      );

    if (vaultErr) {
      console.error("Failed to create vault item:", vaultErr);
    }

    return new Response(
      JSON.stringify({ ai_reflection: aiReflection, reflection_id: reflection.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("spark-reflection-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
