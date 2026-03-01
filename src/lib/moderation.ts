export interface ModerationPayload {
  flagged?: boolean;
  safe?: boolean;
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
