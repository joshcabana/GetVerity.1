export interface AuthCapabilities {
  disableSignup: boolean;
  mailerAutoconfirm: boolean;
  emailEnabled: boolean;
  phoneEnabled: boolean;
}

interface AuthSettingsResponse {
  disable_signup?: boolean;
  mailer_autoconfirm?: boolean;
  external?: {
    email?: boolean;
    phone?: boolean;
  };
}

export const parseRequirePhoneVerification = (rawValue: string | undefined): boolean => {
  return (rawValue ?? "true").toLowerCase() !== "false";
};

export const requirePhoneVerification = (): boolean => {
  return parseRequirePhoneVerification(import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION);
};

export const mapAuthSettingsToCapabilities = (settings: AuthSettingsResponse): AuthCapabilities => {
  return {
    disableSignup: settings.disable_signup ?? true,
    mailerAutoconfirm: settings.mailer_autoconfirm ?? false,
    emailEnabled: settings.external?.email ?? false,
    phoneEnabled: settings.external?.phone ?? false,
  };
};

export const fetchAuthCapabilities = async (): Promise<AuthCapabilities> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase URL or publishable key");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load auth capabilities (${response.status})`);
  }

  const settings = await response.json() as AuthSettingsResponse;
  return mapAuthSettingsToCapabilities(settings);
};
