-- ============================================================================
-- SEED: Rooms, initial Drops, and auth_policy feature flag
-- Purpose: Provide the minimum data needed for beta launch
-- ============================================================================

-- 1. Seed rooms (idempotent — only insert if the rooms table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rooms LIMIT 1) THEN
    INSERT INTO public.rooms (name, description, category, icon, is_premium)
    VALUES
      (
        'Night Owls',
        'For those who come alive after dark. Late-night conversations with fellow insomniacs and stargazers.',
        'lifestyle',
        'moon',
        false
      ),
      (
        'Tech Professionals',
        'Engineers, designers, and builders who appreciate intellect and ambition in equal measure.',
        'career',
        'cpu',
        false
      ),
      (
        'Creatives & Makers',
        'Artists, writers, musicians, and anyone who creates. Where imagination meets connection.',
        'interest',
        'palette',
        false
      ),
      (
        'Over 35',
        'A space for those past the noise. Refined taste, established lives, genuine intent.',
        'age',
        'heart',
        true
      ),
      (
        'Introvert Hours',
        'Lower energy, longer pauses welcome. For those who connect deeply, not loudly.',
        'personality',
        'clock',
        true
      );
  END IF;
END $$;

-- 2. Seed initial Drops — one per free room, scheduled for the next few days
--    Uses AEST (UTC+11) appropriate times for Australian audience.
--    Status is 'upcoming' so they appear in the Lobby immediately.
DO $$
DECLARE
  v_night_owls_id uuid;
  v_tech_id uuid;
  v_creatives_id uuid;
BEGIN
  SELECT id INTO v_night_owls_id FROM public.rooms WHERE name = 'Night Owls' LIMIT 1;
  SELECT id INTO v_tech_id FROM public.rooms WHERE name = 'Tech Professionals' LIMIT 1;
  SELECT id INTO v_creatives_id FROM public.rooms WHERE name = 'Creatives & Makers' LIMIT 1;

  -- Only insert if no drops exist yet (don't duplicate on re-run)
  IF NOT EXISTS (SELECT 1 FROM public.drops LIMIT 1) THEN
    -- Night Owls — Wednesday 10 PM AEST (11:00 UTC)
    INSERT INTO public.drops (title, description, room_id, scheduled_at, duration_minutes, max_capacity, region, timezone, status, is_friendfluence)
    VALUES (
      'Night Owls — Opening Night',
      'The very first Verity Drop. Show up, be real, and see who you connect with after dark.',
      v_night_owls_id,
      (CURRENT_DATE + INTERVAL '1 day' + TIME '11:00:00')::timestamptz,
      60,
      50,
      'AU',
      'Australia/Sydney',
      'upcoming',
      false
    );

    -- Tech Professionals — Thursday 7 PM AEST (08:00 UTC)
    INSERT INTO public.drops (title, description, room_id, scheduled_at, duration_minutes, max_capacity, region, timezone, status, is_friendfluence)
    VALUES (
      'Tech Professionals — Beta Launch',
      'The first Drop for builders and thinkers. 45-second chemistry checks with fellow tech minds.',
      v_tech_id,
      (CURRENT_DATE + INTERVAL '2 days' + TIME '08:00:00')::timestamptz,
      60,
      50,
      'AU',
      'Australia/Sydney',
      'upcoming',
      false
    );

    -- Creatives & Makers — Friday 8 PM AEST (09:00 UTC)
    INSERT INTO public.drops (title, description, room_id, scheduled_at, duration_minutes, max_capacity, region, timezone, status, is_friendfluence)
    VALUES (
      'Creatives & Makers — First Spark',
      'Where imagination meets connection. Show up, say something real, and find your creative counterpart.',
      v_creatives_id,
      (CURRENT_DATE + INTERVAL '3 days' + TIME '09:00:00')::timestamptz,
      60,
      50,
      'AU',
      'Australia/Sydney',
      'upcoming',
      false
    );
  END IF;
END $$;


-- 3. Ensure auth_policy feature flag exists in app_config
--    This is required for get-feature-flags edge function to return 200.
--    Sets phone verification OFF for beta (Supabase phone auth is disabled).
INSERT INTO public.app_config (key, value_json)
VALUES (
  'auth_policy',
  '{"require_phone_verification": false, "enable_replay_vault": true, "enable_friendfluence": true, "enable_voice_intro": true, "enable_guardian_net": true}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
