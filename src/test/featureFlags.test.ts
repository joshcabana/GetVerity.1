import { beforeEach, describe, expect, it, vi } from "vitest";
import { FEATURE_FLAGS_CONFIG_INVALID, fetchFeatureFlags, parseFeatureFlagsPayload } from "@/lib/featureFlags";

const mockInvoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

describe("parseFeatureFlagsPayload", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("maps valid payload to camelCase FeatureFlags", () => {
    const defaults = { enableReplayVault: true, enableFriendfluence: true, enableVoiceIntro: true, enableGuardianNet: true };
    expect(parseFeatureFlagsPayload({ require_phone_verification: false })).toEqual({
      requirePhoneVerification: false,
      ...defaults,
    });

    expect(parseFeatureFlagsPayload({ require_phone_verification: true })).toEqual({
      requirePhoneVerification: true,
      ...defaults,
    });
  });

  it("throws FEATURE_FLAGS_CONFIG_INVALID for malformed payload", () => {
    expect(() => parseFeatureFlagsPayload(null)).toThrow(FEATURE_FLAGS_CONFIG_INVALID);
    expect(() => parseFeatureFlagsPayload({})).toThrow(FEATURE_FLAGS_CONFIG_INVALID);
    expect(() => parseFeatureFlagsPayload({ require_phone_verification: "false" })).toThrow(
      FEATURE_FLAGS_CONFIG_INVALID,
    );
  });

  it("defaults to fail-open when edge function returns an invoke error", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Requested function was not found" },
    });

    await expect(fetchFeatureFlags()).resolves.toEqual({
      requirePhoneVerification: false,
      enableReplayVault: true,
      enableFriendfluence: true,
      enableVoiceIntro: true,
      enableGuardianNet: true,
    });
  });

  it("defaults to fail-open when edge function payload is malformed", async () => {
    mockInvoke.mockResolvedValue({
      data: { require_phone_verification: "invalid" },
      error: null,
    });

    await expect(fetchFeatureFlags()).resolves.toEqual({
      requirePhoneVerification: false,
      enableReplayVault: true,
      enableFriendfluence: true,
      enableVoiceIntro: true,
      enableGuardianNet: true,
    });
  });
});
