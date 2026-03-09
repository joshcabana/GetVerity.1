import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { resolveSafeReturnUrl } from "../_shared/url-validation.ts";
import { getCorsHeaders, ALLOWED_ORIGINS } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { return_url } = await req.json().catch(() => ({ return_url: undefined }));

    // Use stripe_customer_id from user_payment_info first, fall back to email lookup
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: paymentInfo } = await supabaseAdmin
      .from("user_payment_info")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = paymentInfo?.stripe_customer_id;

    if (!customerId) {
      const customerEmail = user.email;
      if (!customerEmail) {
        return new Response(
          JSON.stringify({ error: "No email associated with account" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length === 0) {
        return new Response(
          JSON.stringify({ error: "No subscription found for this account" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      customerId = customers.data[0].id;

      // Cache for future lookups
      await supabaseAdmin
        .from("user_payment_info")
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
    }

    const safeReturnUrl = resolveSafeReturnUrl(return_url, ALLOWED_ORIGINS);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: safeReturnUrl,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("customer-portal error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
