import { describe, expect, it } from "vitest";
import { mapAuthSettingsToCapabilities, parseRequirePhoneVerification } from "@/lib/authCapabilities";

describe("auth capabilities helpers", () => {
  it("treats phone verification as required by default", () => {
    expect(parseRequirePhoneVerification(undefined)).toBe(true);
    expect(parseRequirePhoneVerification("true")).toBe(true);
    expect(parseRequirePhoneVerification("false")).toBe(false);
  });

  it("maps auth settings response into stable capability flags", () => {
    const capabilities = mapAuthSettingsToCapabilities({
      disable_signup: false,
      mailer_autoconfirm: false,
      external: {
        email: true,
        phone: false,
      },
    });

    expect(capabilities).toEqual({
      disableSignup: false,
      mailerAutoconfirm: false,
      emailEnabled: true,
      phoneEnabled: false,
    });
  });
});
