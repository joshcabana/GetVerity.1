const REQUIRED_RUNTIME_KEYS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

export type RequiredRuntimeKey = (typeof REQUIRED_RUNTIME_KEYS)[number];

const readRuntimeValue = (key: RequiredRuntimeKey): string | undefined => {
  const rawValue = (import.meta.env as Record<string, string | undefined>)[key];
  if (!rawValue) return undefined;
  const trimmedValue = rawValue.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

export const getMissingRuntimeEnvKeys = (): RequiredRuntimeKey[] => {
  return REQUIRED_RUNTIME_KEYS.filter((key) => !readRuntimeValue(key));
};

export const getSupabaseRuntimeConfig = (): {
  supabaseUrl: string;
  supabasePublishableKey: string;
} => {
  const missingKeys = getMissingRuntimeEnvKeys();
  if (missingKeys.length > 0) {
    throw new Error(
      `[Verity] Missing runtime environment configuration: ${missingKeys.join(", ")}.`,
    );
  }

  return {
    supabaseUrl: readRuntimeValue("VITE_SUPABASE_URL")!,
    supabasePublishableKey: readRuntimeValue("VITE_SUPABASE_PUBLISHABLE_KEY")!,
  };
};
