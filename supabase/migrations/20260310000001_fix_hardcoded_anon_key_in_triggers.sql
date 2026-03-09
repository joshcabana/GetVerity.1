-- ============================================================
-- FIX: Remove hardcoded Supabase anon key from push notification
-- trigger functions. Instead, use Supabase Vault to store the
-- service role key and reference it via pgsodium.
--
-- PREREQUISITE: Run the following in the Supabase SQL editor
-- (or via the Vault UI) ONCE to store the key:
--
--   SELECT vault.create_secret(
--     '<your-service-role-key>',
--     'supabase_service_role_key',
--     'Service role key for internal edge function calls'
--   );
--
-- The trigger functions below read the key from Vault at runtime.
-- ============================================================

-- Helper: retrieve the service role key from Vault by name.
-- Falls back gracefully if the secret does not exist yet.
CREATE OR REPLACE FUNCTION public.get_vault_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;
  RETURN secret_value;
END;
$$;

-- Recreate notify_new_spark WITHOUT hardcoded key
CREATE OR REPLACE FUNCTION public.notify_new_spark()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
BEGIN
  v_key := public.get_vault_secret('supabase_service_role_key');
  IF v_key IS NULL THEN
    RAISE WARNING 'Vault secret supabase_service_role_key not found — skipping push notification';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) ||
           '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'user_ids', jsonb_build_array(NEW.user_a::text, NEW.user_b::text),
      'title', 'New Spark! ✨',
      'body', 'Someone sparked with you! Open Verity to connect.',
      'url', '/chat/' || NEW.id::text
    )::jsonb
  );
  RETURN NEW;
END;
$$;

-- Recreate notify_new_message WITHOUT hardcoded key
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
  v_spark record;
  v_sender_name text;
  v_key text;
BEGIN
  v_key := public.get_vault_secret('supabase_service_role_key');
  IF v_key IS NULL THEN
    RAISE WARNING 'Vault secret supabase_service_role_key not found — skipping push notification';
    RETURN NEW;
  END IF;

  SELECT user_a, user_b INTO v_spark FROM public.sparks WHERE id = NEW.spark_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  v_partner_id := CASE WHEN v_spark.user_a = NEW.sender_id THEN v_spark.user_b ELSE v_spark.user_a END;

  SELECT display_name INTO v_sender_name FROM public.profiles WHERE user_id = NEW.sender_id;

  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) ||
           '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'user_ids', jsonb_build_array(v_partner_id::text),
      'title', COALESCE(v_sender_name, 'Your Spark'),
      'body', LEFT(COALESCE(NEW.content, '🎙️ Voice message'), 50),
      'url', '/chat/' || NEW.spark_id::text
    )::jsonb
  );
  RETURN NEW;
END;
$$;
