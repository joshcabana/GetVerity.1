import { describe, expect, it } from "vitest";
import { isModerationFlagged } from "@/lib/moderation";

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
});
