import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlags {
  requirePhoneVerification: boolean;
  enableReplayVault: boolean;
  enableFriendfluence: boolean;
  enableVoiceIntro: boolean;
  enableGuardianNet: boolean;
}

interface FeatureFlagsPayload {
  require_phone_verification: boolean;
  enable_replay_vault?: boolean;
  enable_friendfluence?: boolean;
  enable_voice_intro?: boolean;
  enable_guardian_net?: boolean;
}

export const FEATURE_FLAGS_CONFIG_INVALID = "FEATURE_FLAGS_CONFIG_INVALID";
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  requirePhoneVerification: false,
  enableReplayVault: true,
  enableFriendfluence: true,
  enableVoiceIntro: true,
  enableGuardianNet: true,
};

const isFeatureFlagsPayload = (value: unknown): value is FeatureFlagsPayload => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return typeof (value as { require_phone_verification?: unknown }).require_phone_verification === "boolean";
};

export const parseFeatureFlagsPayload = (value: unknown): FeatureFlags => {
  if (!isFeatureFlagsPayload(value)) {
    throw new Error(FEATURE_FLAGS_CONFIG_INVALID);
  }

  return {
    requirePhoneVerification: value.require_phone_verification,
    enableReplayVault: value.enable_replay_vault ?? true,
    enableFriendfluence: value.enable_friendfluence ?? true,
    enableVoiceIntro: value.enable_voice_intro ?? true,
    enableGuardianNet: value.enable_guardian_net ?? true,
  };
};

export const fetchFeatureFlags = async (): Promise<FeatureFlags> => {
  try {
    const { data, error } = await supabase.functions.invoke("get-feature-flags", {
      body: {},
    });

    if (error) {
      throw new Error(error.message || FEATURE_FLAGS_CONFIG_INVALID);
    }

    return parseFeatureFlagsPayload(data);
  } catch (error) {
    const detail = error instanceof Error ? error.message : FEATURE_FLAGS_CONFIG_INVALID;
    console.warn("[Verity] Feature flags unavailable; defaulting to fail-open policy.", detail);
    return DEFAULT_FEATURE_FLAGS;
  }
};
