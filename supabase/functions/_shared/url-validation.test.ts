import { describe, expect, it } from "vitest";
import { resolveSafeReturnUrl } from "./url-validation";

const allowedOrigins = [
  "https://getverity.com.au",
  "https://spark-echo-verity.lovable.app",
];

describe("resolveSafeReturnUrl", () => {
  it("accepts URLs from allowed origins", () => {
    const result = resolveSafeReturnUrl(
      "https://getverity.com.au/profile?tab=billing",
      allowedOrigins,
    );

    expect(result).toBe("https://getverity.com.au/profile?tab=billing");
  });

  it("rejects host spoofing via startsWith-style bypasses", () => {
    const result = resolveSafeReturnUrl(
      "https://getverity.com.au.evil.example/tokens",
      allowedOrigins,
    );

    expect(result).toBe("https://getverity.com.au/tokens");
  });

  it("falls back on malformed URL values", () => {
    const result = resolveSafeReturnUrl("not-a-url", allowedOrigins);
    expect(result).toBe("https://getverity.com.au/tokens");
  });

  it("falls back on non-string values", () => {
    const result = resolveSafeReturnUrl({} as unknown, allowedOrigins);
    expect(result).toBe("https://getverity.com.au/tokens");
  });
});
