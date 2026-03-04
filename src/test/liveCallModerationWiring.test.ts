import { describe, expect, it } from "vitest";
import { isModerationFlagged, isScoreAboveThreshold, MODERATION_THRESHOLDS } from "@/lib/moderation";

describe("moderation decision parsing", () => {
  it("honors explicit flagged responses", () => {
    expect(isModerationFlagged({ flagged: true, safe: true })).toBe(true);
    expect(isModerationFlagged({ flagged: false, safe: false })).toBe(false);
  });

  it("falls back to inverse safe responses for backward compatibility", () => {
    expect(isModerationFlagged({ safe: false })).toBe(true);
    expect(isModerationFlagged({ safe: true })).toBe(false);
  });

  it("fails safe on unknown payload shapes", () => {
    expect(isModerationFlagged(null)).toBe(false);
    expect(isModerationFlagged({})).toBe(false);
  });

  it("treats low-score results as safe (false-positive guard)", () => {
    expect(isModerationFlagged({ flagged: false, safe: true, score: 0.2 })).toBe(false);
    expect(isModerationFlagged({ flagged: false, safe: true, score: 0.1 })).toBe(false);
  });
});

describe("score-based threshold checks", () => {
  it("does not flag when score is below safe threshold", () => {
    expect(isScoreAboveThreshold(0.1, MODERATION_THRESHOLDS.SAFE)).toBe(false);
    expect(isScoreAboveThreshold(0.29, MODERATION_THRESHOLDS.SAFE)).toBe(false);
  });

  it("flags when score meets or exceeds warn threshold", () => {
    expect(isScoreAboveThreshold(0.6, MODERATION_THRESHOLDS.WARN)).toBe(true);
    expect(isScoreAboveThreshold(0.85, MODERATION_THRESHOLDS.WARN)).toBe(true);
  });

  it("identifies auto-action scores", () => {
    expect(isScoreAboveThreshold(0.85, MODERATION_THRESHOLDS.AUTO_ACTION)).toBe(true);
    expect(isScoreAboveThreshold(0.84, MODERATION_THRESHOLDS.AUTO_ACTION)).toBe(false);
  });

  it("handles null/undefined scores safely", () => {
    expect(isScoreAboveThreshold(null)).toBe(false);
    expect(isScoreAboveThreshold(undefined)).toBe(false);
  });
});
