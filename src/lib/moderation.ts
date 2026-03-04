/** Named moderation thresholds (must match ai-moderate edge function) */
export const MODERATION_THRESHOLDS = {
  SAFE: 0.3,
  WARN: 0.6,
  AUTO_ACTION: 0.85,
} as const;

export interface ModerationPayload {
  flagged?: boolean;
  safe?: boolean;
  score?: number;
}

/**
 * Backward-compatible moderation decision parser.
 * Prefers explicit `flagged`, then falls back to inverse `safe`.
 */
export const isModerationFlagged = (payload: ModerationPayload | null | undefined): boolean => {
  if (!payload) return false;
  if (typeof payload.flagged === "boolean") return payload.flagged;
  if (typeof payload.safe === "boolean") return !payload.safe;
  return false;
};

/**
 * Score-based threshold check.
 * Returns true only if score meets or exceeds the WARN threshold.
 */
export const isScoreAboveThreshold = (
  score: number | undefined | null,
  threshold: number = MODERATION_THRESHOLDS.WARN,
): boolean => {
  if (score == null) return false;
  return score >= threshold;
};
