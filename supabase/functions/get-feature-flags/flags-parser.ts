export const FEATURE_FLAGS_CONFIG_INVALID = "FEATURE_FLAGS_CONFIG_INVALID";

export interface FeatureFlagsPayload {
  require_phone_verification: boolean;
  enable_replay_vault: boolean;
  enable_friendfluence: boolean;
  enable_voice_intro: boolean;
  enable_guardian_net: boolean;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const parseFeatureFlagsRecord = (value: unknown): FeatureFlagsPayload => {
  if (!isPlainObject(value)) {
    throw new Error(FEATURE_FLAGS_CONFIG_INVALID);
  }

  const requirePhone = value.require_phone_verification;
  if (typeof requirePhone !== "boolean") {
    throw new Error(FEATURE_FLAGS_CONFIG_INVALID);
  }

  return {
    require_phone_verification: requirePhone,
    enable_replay_vault: typeof value.enable_replay_vault === "boolean" ? value.enable_replay_vault : true,
    enable_friendfluence: typeof value.enable_friendfluence === "boolean" ? value.enable_friendfluence : true,
    enable_voice_intro: typeof value.enable_voice_intro === "boolean" ? value.enable_voice_intro : true,
    enable_guardian_net: typeof value.enable_guardian_net === "boolean" ? value.enable_guardian_net : true,
  };
};
