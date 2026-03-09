-- ============================================================
-- FIX: Atomic token credit via SQL RPC (prevents race condition
-- in stripe-webhook read-then-write pattern)
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_tokens(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET token_balance = token_balance + p_amount
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================================
-- FIX: Change platform_stats.ai_accuracy DEFAULT from 96.80 to NULL
-- ============================================================

ALTER TABLE public.platform_stats
  ALTER COLUMN ai_accuracy SET DEFAULT NULL;

-- ============================================================
-- FIX: feature_flags config key mismatch.
-- find-match queries key='feature_flags' but migration seeded 'auth_policy'.
-- Insert a 'feature_flags' row that mirrors auth_policy so both lookups work.
-- ============================================================

INSERT INTO public.app_config (key, value_json)
SELECT 'feature_flags', value_json
FROM public.app_config
WHERE key = 'auth_policy'
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- INFO: Add database indexes for common query patterns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON public.calls (caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_callee_id ON public.calls (callee_id);
CREATE INDEX IF NOT EXISTS idx_sparks_user_a ON public.sparks (user_a);
CREATE INDEX IF NOT EXISTS idx_sparks_user_b ON public.sparks (user_b);
CREATE INDEX IF NOT EXISTS idx_messages_spark_id_created ON public.messages (spark_id, created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_user ON public.moderation_flags (flagged_user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_drop_status ON public.matchmaking_queue (drop_id, status);
