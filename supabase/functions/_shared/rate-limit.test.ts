import { describe, it, expect, beforeEach } from "vitest";

// We can't directly import the Deno-targeted module, so we test the logic inline
describe("Rate Limiter Logic", () => {
  interface RateLimitEntry {
    count: number;
    resetAt: number;
  }

  const store = new Map<string, RateLimitEntry>();

  function rateLimit(key: string, limit: number, windowMs = 60_000): boolean {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    entry.count++;
    if (entry.count > limit) {
      return false;
    }
    return true;
  }

  beforeEach(() => {
    store.clear();
  });

  it("allows requests under the limit", () => {
    expect(rateLimit("user1", 3)).toBe(true);
    expect(rateLimit("user1", 3)).toBe(true);
    expect(rateLimit("user1", 3)).toBe(true);
  });

  it("blocks requests over the limit", () => {
    expect(rateLimit("user2", 2)).toBe(true);
    expect(rateLimit("user2", 2)).toBe(true);
    expect(rateLimit("user2", 2)).toBe(false); // 3rd request blocked
  });

  it("isolates different keys", () => {
    expect(rateLimit("user3", 1)).toBe(true);
    expect(rateLimit("user3", 1)).toBe(false); // blocked
    expect(rateLimit("user4", 1)).toBe(true); // different key, allowed
  });

  it("resets after the window expires", () => {
    // Use a very short window
    expect(rateLimit("user5", 1, 1)).toBe(true);
    expect(rateLimit("user5", 1, 1)).toBe(false);

    // Wait for the window to pass (entry.resetAt was now+1ms)
    // Manually expire by setting resetAt in the past
    const entry = store.get("user5")!;
    entry.resetAt = Date.now() - 1;

    expect(rateLimit("user5", 1, 1)).toBe(true); // should be allowed again
  });

  it("returns true for the first request always", () => {
    for (let i = 0; i < 100; i++) {
      expect(rateLimit(`unique-${i}`, 1)).toBe(true);
    }
  });
});
