-- Add indexes for common query patterns to improve performance at scale.
-- All use IF NOT EXISTS to be safely idempotent.

-- calls: looked up by caller_id and callee_id frequently (SparkHistory, Chat, admin)
CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_callee_id ON calls(callee_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);

-- sparks: queried by both user_a and user_b for spark history
CREATE INDEX IF NOT EXISTS idx_sparks_user_a ON sparks(user_a);
CREATE INDEX IF NOT EXISTS idx_sparks_user_b ON sparks(user_b);

-- messages: queried by spark_id + ordered by created_at (chat view)
CREATE INDEX IF NOT EXISTS idx_messages_spark_id_created ON messages(spark_id, created_at);

-- matchmaking_queue: hot path during drops, queried by drop_id + status
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_drop_status ON matchmaking_queue(drop_id, status);

-- moderation_flags: queried by user_id for appeal flow, and by status for admin
CREATE INDEX IF NOT EXISTS idx_moderation_flags_user_id ON moderation_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_status ON moderation_flags(status);

-- user_trust: queried by user_id on every authenticated request
CREATE INDEX IF NOT EXISTS idx_user_trust_user_id ON user_trust(user_id);
