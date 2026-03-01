-- Owner-mode RLS hardening:
-- 1) Restrict direct profile/call/queue writes from authenticated clients.
-- 2) Add narrowly scoped SECURITY DEFINER RPCs for safe user updates.

-- PROFILES: remove broad client write access, keep read access.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_handle text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    bio = COALESCE(p_bio, bio),
    city = COALESCE(p_city, city),
    gender = COALESCE(p_gender, gender),
    handle = COALESCE(p_handle, handle)
  WHERE user_id = v_user_id
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text, text, text, text, text) TO authenticated;

-- CALLS: remove broad client update/insert access and expose a constrained decision RPC.
DROP POLICY IF EXISTS "Users can update own call decisions" ON public.calls;
DROP POLICY IF EXISTS "System can insert calls" ON public.calls;

CREATE OR REPLACE FUNCTION public.submit_call_decision(
  p_call_id uuid,
  p_decision spark_decision
)
RETURNS public.calls
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_call public.calls;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT *
  INTO v_call
  FROM public.calls
  WHERE id = p_call_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Call not found';
  END IF;

  IF v_user_id <> v_call.caller_id AND v_user_id <> v_call.callee_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_user_id = v_call.caller_id THEN
    IF v_call.caller_decision IS NOT NULL AND v_call.caller_decision <> p_decision THEN
      RAISE EXCEPTION 'Caller decision already submitted';
    END IF;

    UPDATE public.calls
    SET caller_decision = COALESCE(caller_decision, p_decision)
    WHERE id = p_call_id
    RETURNING * INTO v_call;
  ELSE
    IF v_call.callee_decision IS NOT NULL AND v_call.callee_decision <> p_decision THEN
      RAISE EXCEPTION 'Callee decision already submitted';
    END IF;

    UPDATE public.calls
    SET callee_decision = COALESCE(callee_decision, p_decision)
    WHERE id = p_call_id
    RETURNING * INTO v_call;
  END IF;

  RETURN v_call;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_call_decision(uuid, spark_decision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_call_decision(uuid, spark_decision) TO authenticated;

-- MATCHMAKING QUEUE: remove broad ALL policy and provide read-only visibility for own rows.
DROP POLICY IF EXISTS "Users can manage own queue entry" ON public.matchmaking_queue;
CREATE POLICY "Users can view own queue entries"
ON public.matchmaking_queue
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- SPARKS/TOKEN TRANSACTIONS: remove direct client insert paths.
DROP POLICY IF EXISTS "System can insert sparks" ON public.sparks;
DROP POLICY IF EXISTS "System can insert transactions" ON public.token_transactions;
