import { describe, expect, it } from "vitest";
import { FEATURE_FLAGS_CONFIG_INVALID, parseFeatureFlagsRecord } from "./flags-parser";

describe("parseFeatureFlagsRecord", () => {
  it("parses a valid auth policy row", () => {
    const defaults = { enable_replay_vault: true, enable_friendfluence: true, enable_voice_intro: true, enable_guardian_net: true };
    expect(parseFeatureFlagsRecord({ require_phone_verification: false })).toEqual({
      require_phone_verification: false,
      ...defaults,
    });
    expect(parseFeatureFlagsRecord({ require_phone_verification: true })).toEqual({
      require_phone_verification: true,
      ...defaults,
    });
  });

  it("throws FEATURE_FLAGS_CONFIG_INVALID for malformed payloads", () => {
    expect(() => parseFeatureFlagsRecord(null)).toThrow(FEATURE_FLAGS_CONFIG_INVALID);
    expect(() => parseFeatureFlagsRecord({})).toThrow(FEATURE_FLAGS_CONFIG_INVALID);
    expect(() => parseFeatureFlagsRecord({ require_phone_verification: "false" })).toThrow(
      FEATURE_FLAGS_CONFIG_INVALID,
    );
  });
});
