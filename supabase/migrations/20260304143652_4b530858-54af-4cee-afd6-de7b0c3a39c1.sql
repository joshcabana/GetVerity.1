
-- 1. Atomic token deduction RPC for spark-extend
CREATE OR REPLACE FUNCTION public.deduct_tokens(p_user_id uuid, p_cost integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET token_balance = token_balance - p_cost,
      updated_at = now()
  WHERE user_id = p_user_id
    AND token_balance >= p_cost;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient tokens';
  END IF;
END;
$$;

-- 2. Harden update_my_profile with input validation
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_handle text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate display_name length
  IF p_display_name IS NOT NULL AND (length(p_display_name) < 1 OR length(p_display_name) > 50) THEN
    RAISE EXCEPTION 'Display name must be 1-50 characters';
  END IF;

  -- Validate avatar_url format and domain allowlist
  IF p_avatar_url IS NOT NULL THEN
    IF length(p_avatar_url) > 2048 THEN
      RAISE EXCEPTION 'Avatar URL too long';
    END IF;
    IF p_avatar_url !~ '^https://' THEN
      RAISE EXCEPTION 'Avatar URL must use HTTPS';
    END IF;
    -- Allow Supabase storage URLs and common CDNs
    IF p_avatar_url !~ '^https://(.*\.supabase\.co/|.*\.supabase\.in/)' THEN
      RAISE EXCEPTION 'Avatar URL domain not allowed';
    END IF;
  END IF;

  -- Validate bio length
  IF p_bio IS NOT NULL AND length(p_bio) > 500 THEN
    RAISE EXCEPTION 'Bio must be under 500 characters';
  END IF;

  -- Validate city length
  IF p_city IS NOT NULL AND length(p_city) > 100 THEN
    RAISE EXCEPTION 'City must be under 100 characters';
  END IF;

  -- Validate gender length
  IF p_gender IS NOT NULL AND length(p_gender) > 30 THEN
    RAISE EXCEPTION 'Gender must be under 30 characters';
  END IF;

  -- Validate handle format
  IF p_handle IS NOT NULL AND (length(p_handle) > 30 OR p_handle !~ '^[a-zA-Z0-9_]+$') THEN
    RAISE EXCEPTION 'Handle must be 1-30 alphanumeric characters or underscores';
  END IF;

  UPDATE public.profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    bio = COALESCE(p_bio, bio),
    city = COALESCE(p_city, city),
    gender = COALESCE(p_gender, gender),
    handle = COALESCE(p_handle, handle),
    updated_at = now()
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;
