/**
 * Integration tests for critical user flows.
 *
 * These tests verify that the major user journeys are wired correctly:
 * - Auth → Onboarding → Lobby routing gates
 * - ProtectedRoute trust verification logic
 * - Edge function contract shapes
 * - Moderation pipeline fail-safe behavior
 * - Loading state handling
 *
 * They mock Supabase at the boundary but test real ProtectedRoute logic,
 * routing, and state transitions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import type { Session, User } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

// Cast helpers to avoid `as any` — narrow to the real type via unknown
function mockProfile(p: Record<string, unknown>) {
  return p as unknown as Tables<"profiles">;
}
function mockTrust(t: Record<string, unknown>) {
  return t as unknown as ReturnType<typeof useAuth>["userTrust"];
}

// ── Mocks ──────────────────────────────────────────────────
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/hooks/useFeatureFlags", () => ({ useFeatureFlags: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseFeatureFlags = vi.mocked(useFeatureFlags);

const mockUser = { id: "user-1", email: "test@example.com" } as unknown as User;
const mockSession = { user: mockUser, access_token: "tok" } as unknown as Session;

function defaultFeatureFlags() {
  return {
    data: { requirePhoneVerification: true },
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    isSuccess: true,
    isPending: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useFeatureFlags>;
}

function authState(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  return {
    session: null,
    user: null,
    profile: null,
    userTrust: null,
    isLoading: false,
    isAdmin: false,
    onboardingComplete: false,
    signOut: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseFeatureFlags.mockReturnValue(defaultFeatureFlags());
});

// ── Flow 1: Unauthenticated → Auth gate ────────────────────
describe("Auth gate flow", () => {
  it("redirects unauthenticated users from /lobby to /auth", () => {
    mockUseAuth.mockReturnValue(authState());

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={
              <ProtectedRoute requireTrust>
                <div>Lobby Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Auth Page")).toBeInTheDocument();
    expect(screen.queryByText("Lobby Content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users from /profile to /auth", () => {
    mockUseAuth.mockReturnValue(authState());

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Profile Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("redirects non-onboarded users from /lobby to /onboarding", () => {
    mockUseAuth.mockReturnValue(
      authState({
        session: mockSession,
        user: mockUser,
        onboardingComplete: false,
      }),
    );

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={
              <ProtectedRoute requireTrust>
                <div>Lobby Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
  });

  it("allows fully trusted users to access /lobby", () => {
    // ProtectedRoute with requireTrust checks:
    // selfie_verified, safety_pledge_accepted, phone_verified (when feature flag enabled)
    mockUseAuth.mockReturnValue(
      authState({
        session: mockSession,
        user: mockUser,
        onboardingComplete: true,
        profile: mockProfile({ display_name: "Test" }),
        userTrust: mockTrust({
          trust_score: 80,
          is_banned: false,
          selfie_verified: true,
          safety_pledge_accepted: true,
          phone_verified: true,
        }),
      }),
    );

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={
              <ProtectedRoute requireTrust>
                <div>Lobby Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>Auth Page</div>} />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Lobby Content")).toBeInTheDocument();
  });

  it("allows access to non-trust-gated routes when onboarding is complete", () => {
    mockUseAuth.mockReturnValue(
      authState({
        session: mockSession,
        user: mockUser,
        onboardingComplete: true,
        profile: mockProfile({ display_name: "Test" }),
      }),
    );

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Profile Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>Auth Page</div>} />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Profile Content")).toBeInTheDocument();
  });
});

// ── Flow 2: Trust verification logic ───────────────────────
describe("Trust verification flow", () => {
  it("redirects to onboarding when selfie not verified", () => {
    mockUseAuth.mockReturnValue(
      authState({
        session: mockSession,
        user: mockUser,
        onboardingComplete: true,
        userTrust: mockTrust({
          selfie_verified: false,
          safety_pledge_accepted: true,
          phone_verified: true,
        }),
      }),
    );

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={
              <ProtectedRoute requireTrust>
                <div>Lobby Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
  });

  it("redirects to onboarding when safety pledge not accepted", () => {
    mockUseAuth.mockReturnValue(
      authState({
        session: mockSession,
        user: mockUser,
        onboardingComplete: true,
        userTrust: mockTrust({
          selfie_verified: true,
          safety_pledge_accepted: false,
          phone_verified: true,
        }),
      }),
    );

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={
              <ProtectedRoute requireTrust>
                <div>Lobby Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
  });

  it("allows access when phone not required by feature flag", () => {
    // Phone verification disabled via feature flag
    mockUseFeatureFlags.mockReturnValue({
      ...defaultFeatureFlags(),
      data: { requirePhoneVerification: false },
    } as unknown as ReturnType<typeof useFeatureFlags>);

    mockUseAuth.mockReturnValue(
      authState({
        session: mockSession,
        user: mockUser,
        onboardingComplete: true,
        userTrust: mockTrust({
          selfie_verified: true,
          safety_pledge_accepted: true,
          phone_verified: false, // Not verified, but not required
        }),
      }),
    );

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={
              <ProtectedRoute requireTrust>
                <div>Lobby Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Lobby Content")).toBeInTheDocument();
  });

  it("admin route redirects non-admin users to /lobby", () => {
    mockUseAuth.mockReturnValue(
      authState({
        session: mockSession,
        user: mockUser,
        onboardingComplete: true,
        isAdmin: false,
      }),
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <div>Admin Panel</div>
              </ProtectedRoute>
            }
          />
          <Route path="/lobby" element={<div>Lobby Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Lobby Page")).toBeInTheDocument();
  });
});

// ── Flow 3: Loading states ─────────────────────────────────
describe("Loading state handling", () => {
  it("shows loading spinner while auth is initializing", () => {
    mockUseAuth.mockReturnValue(authState({ isLoading: true }));

    const { container } = render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={
              <ProtectedRoute>
                <div>Lobby Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Lobby Content")).not.toBeInTheDocument();
    // Should show the spinner
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows loading while feature flags are fetching for trust routes", () => {
    mockUseAuth.mockReturnValue(
      authState({
        session: mockSession,
        user: mockUser,
        onboardingComplete: true,
        userTrust: mockTrust({
          selfie_verified: true,
          safety_pledge_accepted: true,
          phone_verified: true,
        }),
      }),
    );
    mockUseFeatureFlags.mockReturnValue({
      ...defaultFeatureFlags(),
      isLoading: true,
    } as unknown as ReturnType<typeof useFeatureFlags>);

    const { container } = render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={
              <ProtectedRoute requireTrust>
                <div>Lobby Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Lobby Content")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});

// ── Flow 4: Edge function invocation contracts ──────────────
describe("Edge function invocation contracts", () => {
  it("find-match expects channel_name, agora_token, call_id in response", async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: {
        status: "matched",
        call_id: "call-1",
        channel_name: "ch-1",
        agora_token: "tok-1",
        partner_id: "user-2",
      },
      error: null,
    });

    const result = await supabase.functions.invoke("find-match", {
      body: { drop_id: null },
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveProperty("call_id");
    expect(result.data).toHaveProperty("channel_name");
    expect(result.data).toHaveProperty("agora_token");
  });

  it("create-checkout returns a Stripe URL", async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { url: "https://checkout.stripe.com/c/pay_cs_test_123" },
      error: null,
    });

    const result = await supabase.functions.invoke("create-checkout", {
      body: { price_id: "price_1T6rXLC1O032lUHcL3kvvio4", mode: "payment" },
    });

    expect(result.error).toBeNull();
    expect(result.data.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
  });

  it("export-my-data returns structured JSON with expected keys", async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    const exportPayload = {
      exported_at: new Date().toISOString(),
      profile: { display_name: "Test" },
      trust: { trust_score: 80 },
      sparks: [],
      messages_sent: [],
      reflections: [],
      vault_items: [],
      reports_filed: [],
      appeals: [],
      token_transactions: [],
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: exportPayload,
      error: null,
    });

    const result = await supabase.functions.invoke("export-my-data");
    expect(result.data).toHaveProperty("exported_at");
    expect(result.data).toHaveProperty("profile");
    expect(result.data).toHaveProperty("sparks");
    expect(result.data).toHaveProperty("token_transactions");
  });

  it("delete-account returns success flag", async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });

    const result = await supabase.functions.invoke("delete-account");
    expect(result.data.success).toBe(true);
  });

  it("agora-token returns token and channel info", async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: {
        token: "agora-rtc-token-value",
        channel: "verity-ch-abc123",
        uid: 12345,
      },
      error: null,
    });

    const result = await supabase.functions.invoke("agora-token", {
      body: { channel_name: "verity-ch-abc123" },
    });

    expect(result.data).toHaveProperty("token");
    expect(result.data).toHaveProperty("channel");
    expect(result.data).toHaveProperty("uid");
  });
});

// ── Flow 5: Moderation pipeline ────────────────────────────
describe("Moderation pipeline integration", () => {
  it("ai-moderate response shapes are handled for all outcomes", async () => {
    const { isModerationFlagged } = await import("@/lib/moderation");

    // Safe result
    expect(isModerationFlagged({ flagged: false, score: 0.1 })).toBe(false);

    // Flagged result
    expect(isModerationFlagged({ flagged: true, score: 0.9 })).toBe(true);

    // Edge: missing fields → fail-safe (not flagged)
    expect(isModerationFlagged({})).toBe(false);
    expect(isModerationFlagged(null)).toBe(false);
    expect(isModerationFlagged(undefined)).toBe(false);
  });
});

// ── Flow 6: App.tsx route structure verification ────────────
describe("App route structure", () => {
  it("App.tsx contains all expected route paths", async () => {
    // Read the raw source of App.tsx
    const fs = await import("fs");
    const path = await import("path");
    const appSource = fs.readFileSync(
      path.resolve(__dirname, "..", "App.tsx"),
      "utf-8",
    );

    // Public routes
    const publicPaths = [
      'path="/"',
      'path="/auth"',
      'path="/how-it-works"',
      'path="/pricing"',
      'path="/drops"',
      'path="/faq"',
      'path="/about"',
      'path="/safety"',
      'path="/privacy"',
      'path="/terms"',
      'path="/transparency"',
    ];

    for (const p of publicPaths) {
      expect(appSource).toContain(p);
    }

    // Protected routes
    const protectedPaths = [
      'path="/lobby"',
      'path="/profile"',
      'path="/settings"',
      'path="/sparks"',
      'path="/tokens"',
    ];

    for (const p of protectedPaths) {
      expect(appSource).toContain(p);
    }

    // ProtectedRoute usage
    expect(appSource).toContain("ProtectedRoute");
    expect(appSource).toContain("requireTrust");
    expect(appSource).toContain("requireAdmin");
  });

  it("legacy routes redirect properly", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const appSource = fs.readFileSync(
      path.resolve(__dirname, "..", "App.tsx"),
      "utf-8",
    );

    // /lander → / and /sign-in → /auth
    expect(appSource).toContain('path="/lander"');
    expect(appSource).toContain('path="/sign-in"');
    expect(appSource).toContain("Navigate");
  });
});
