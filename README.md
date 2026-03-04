# Verity — Anonymous Speed Dating Platform

## Project Overview

**Verity** is a verified, anonymous speed dating platform designed to solve the burnout epidemic in modern dating apps. The swipe economy is broken — 78% of dating-app users experience burnout, 80% of women report dating fatigue, and ghosting accounts for 41% of that fatigue. Verity's answer is radical: real eyes, real voice, 45 seconds, and dignity always.

**Core mechanic:** Users RSVP to themed, time-limited "Drops" (scheduled speed dating sessions). When a Drop goes live, participants are matched anonymously for a 45-second video call. Both choose Spark or Pass independently. Only a **mutual spark** reveals identities and unlocks post-call chat — no rejection notifications, ever.
**Project overview**: See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for a detailed examination of objectives, strategy, timelines, and current status.

---

## Primary Objectives

| # | Objective | Outcome |
|---|-----------|---------|
| 1 | **Authentic first impressions** | Replace profile-photo bias with live voice and video — real chemistry in 45 seconds |
| 2 | **Zero ghosting by design** | Mutual-spark gate means no unrequited contact; no rejection signals sent |
| 3 | **Safety first** | Live safety checks (metadata + transcript snippets where available), identity verification (phone + selfie), safety pledge, and user blocking |
| 4 | **Privacy by default** | Anonymous until mutual spark; raw call video is not stored |
| 5 | **Radical transparency** | Public safety stats, moderation rates, and gender-balance metrics published in real time |
| 6 | **Intention over addiction** | No infinite scroll, no streaks, no dopamine loops — Verity is used, not consumed |

---

## Strategic Plan & Milestones

### Phase 1 — Core Platform ✅ Complete
- User authentication (email/password via Supabase Auth)
- Onboarding flow with identity verification (phone + selfie + safety pledge)
- Lobby with upcoming/live Drops, RSVP management, and real-time updates
- Anonymous video calls via Agora RTC (45-second sessions)
- Mutual-spark decision mechanic with post-call chat unlock
- Spark history and chat inbox

### Phase 2 — Safety & Infrastructure ✅ Complete
- AI moderation function (`ai-moderate`) gated behind call participation check
- Matchmaking queue with Drop-scoped unique constraint
- User blocking (`user_blocks` table with RLS policies)
- Selfie verification storage bucket with per-user access controls
- Admin dashboard: moderation queue, appeals inbox, analytics, user management
- Transparency page: live safety stats, founding principles, gender balance chart
- Appeal submission flow for moderation decisions

### Phase 3 — Payments & Premium ✅ Complete
- Token shop with Stripe Checkout (starter, popular, value packs)
- Verity Pass subscription (monthly and annual tiers)
- Stripe Customer Portal for subscription management
- Stripe webhook handler with idempotency and customer-ID mapping
- Token balance and transaction history tracking

### Phase 4 — Innovations ✅ Complete (Feature-Flagged)
- **Friendfluence Drops** — Invite a friend to the same Drop for shared courage (gated by `enable_friendfluence` flag)
- **Spark Reflection** — Private post-call AI insight (tone/energy analysis via Lovable AI Gateway)
- **Verity Voice Intro** — Optional 15-second voice note before text chat (gated by `enable_voice_intro` flag)
- **Guardian Net** — One-tap safe-call signal to a trusted friend (gated by `enable_guardian_net` flag)
- **Chemistry Replay Vault** — 8-second highlight reel from mutual-spark calls (gated by `enable_replay_vault` flag)

### Phase 5 — Operations & Polish ✅ Complete
- Push notifications for RSVP reminders and new Spark matches (Web Push via VAPID keys)
- Automated platform stats aggregation (`aggregate-stats` edge function)
- JSON-LD structured data on landing page (inline in index.html for crawler first-paint)
- Unread message count badge on Sparks tab in bottom navigation
- 11 test suites with 40+ passing tests (auth, feature flags, routing, Guardian Net, Voice Intro, moderation wiring, matchmaking atomicity)
- Production polish: error boundaries, lazy loading, bundle splitting via `manualChunks`
- Agora Cloud Recording: `start-cloud-recording` and `stop-cloud-recording` edge functions
- About page with solo founder story and trust signals
- Admin Pilot Metrics dashboard (call completion rate, mutual spark rate, moderation false-positive rate)

---

## Architecture

See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for the full architecture documentation covering:
- System layers (frontend, backend, video, payments, AI)
- Database schema and RLS policies
- Edge function inventory
- Security model and data flow

---

## Pilot Results (Placeholder)

| Metric | Value | Notes |
|--------|-------|-------|
| Call completion rate | TBD | % of calls that reach `ended_at` |
| Mutual spark rate | TBD | % of completed calls with `is_mutual_spark=true` |
| Moderation accuracy | TBD | % of AI flags not cleared by human review |
| Appeal upheld rate | TBD | % of appeals decided in user's favour |
| Average call duration | TBD | Mean seconds of active calls |

*These metrics are surfaced live in the Admin → Pilot dashboard.*

---

## Current Progress

### Completed ✅
- Full frontend (React + Vite + TypeScript + shadcn-ui + Tailwind CSS)
- All core pages: Landing, Auth, Onboarding, Lobby, Live Call, Spark History, Chat, Token Shop, Admin, Transparency, Appeal, Profile, Friendfluence, About
- Supabase backend: auth, profiles, drops, calls, sparks, messages, matchmaking queue, token transactions
- 19 edge functions deployed (matchmaking, video auth, AI moderation, payments, appeals, admin, push notifications, stats aggregation, feature flags, VAPID key generation, friend invites, demo tokens, cloud recording start/stop, replay generation)
- 13 RPC functions (`claim_match_candidate`, `get_drop_rsvp_count`, `has_role`, `is_spark_member`, `submit_call_decision`, `update_my_profile`, `shares_spark_with`, `get_spark_partner_profile`, `check_mutual_spark`, `notify_new_message`, `notify_new_spark`, `handle_new_user`, `update_updated_at_column`)
- Agora real-token generation with 10-minute expiry (using `agora-token` npm package)
- Security hardening: auth on all edge functions, price-ID allowlist, origin allowlist, idempotent webhooks
- Realtime subscriptions for drops, RSVPs, calls, and messages
- Phase 4 features gated behind `app_config` feature flags (`enable_replay_vault`, `enable_friendfluence`, `enable_voice_intro`, `enable_guardian_net`)
- AI moderation with named thresholds (SAFE=0.3, WARN=0.6, AUTO_ACTION=0.85) and false-positive guard
- Push notifications system (VAPID keys, service worker, subscription management)
- Platform stats aggregation cron (automated daily via `aggregate-stats`)
- SEO: JSON-LD in index.html, OG/Twitter meta tags, noscript fallback, canonical URL
- Admin Pilot Metrics dashboard (call completion, spark rate, moderation FP rate)
- 11 test suites, 40+ passing tests

### In Progress 🔄
- Tuning AI moderation thresholds and browser transcript coverage fallbacks

### Upcoming 📋
- Granular drop scheduling (region targeting, capacity management)

---

## Deployment Checklist (Public Beta)

- [ ] **Environment secrets configured** in Lovable Cloud:
  - `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, `AGORA_CUSTOMER_KEY`, `AGORA_CUSTOMER_SECRET`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
  - `LOVABLE_API_KEY` (for AI moderation)
- [ ] **Stripe webhook** endpoint registered in Stripe Dashboard → pointing to `stripe-webhook` edge function
- [ ] **Feature flags** defaults set in `app_config` table (key: `auth_policy`)
- [ ] **DNS** configured for custom domain (`getverity.com.au`)
- [ ] **Agora Cloud Recording** S3/storage bucket configured for recording output
- [ ] **Run full test suite** (`npm test`) — all tests green
- [ ] **Publish** frontend via Lovable Cloud
- [ ] **Smoke test** end-to-end: signup → onboarding → RSVP → call → spark → chat

---

## Challenges & Mitigations

| Challenge | Mitigation |
|-----------|-----------|
| **Payment security** — `create-checkout` accepted arbitrary `customer_email` and `success_url` from clients, enabling fraud and open-redirect attacks | Rewrote to authenticate the caller's JWT, derive email from the verified session, build redirect URLs server-side from an origin allowlist, and validate `price_id` against a hardcoded map |
| **Stripe webhook idempotency** — duplicate webhook deliveries could credit tokens or subscriptions multiple times | Added `stripe_processed_events` table (primary key on `event_id`); duplicate events return `{ received: true }` immediately |
| **Agora stub tokens** — early implementation returned placeholder tokens, breaking real calls | Replaced with `RtcTokenBuilder.buildTokenWithUid` (10-minute expiry); call-participation verified server-side before token is issued |
| **Open redirect in customer portal** — `return_url` was accepted verbatim from client, enabling redirect to arbitrary sites | Replaced with strict URL parsing + exact-origin allowlist validation; falls back to `/tokens` when invalid |
| **forwardRef console warnings** — React internals attaching refs to function components caused noisy dev-mode warnings | Initially wrapped components with `forwardRef`; reverted after it caused `Component is not a function` runtime crashes with Vite HMR. Remaining warnings are cosmetic, from third-party libraries (next-themes, react-helmet-async) |
| **Test coverage gap** — Only 1 placeholder test existed at launch | Resolved: 11 test suites with 40+ passing tests covering auth, feature flags, routing, components, moderation, and edge function logic |
| **Stats population** — Transparency and Admin pages showed zero values | Resolved: `aggregate-stats` edge function deployed as automated cron job |
| **AI moderation stub** — Random-score stub replaced with real LLM (Gemini 2.5 Flash Lite) with structured tool-use and policy-based risk scoring | Now wired into live calls with named thresholds (SAFE/WARN/AUTO_ACTION) |

---

## Adjustments to Original Plans

1. **AI moderation timeline shifted** — Transcript-assisted moderation is now wired in the live call flow (with browser fallback behavior) and is being tuned before pilot launch.
2. **Security hardening promoted to Phase 2** — Originally planned for a later hardening sprint; vulnerabilities found in payment flows were addressed immediately before any public launch.
3. **Customer ID mapping added to webhook** — Original plan used email-only lookup; Stripe email can change, so `stripe_customer_id` is now stored on `user_payment_info` for deterministic lookup.
4. **Phase 4 features gated behind feature flags** — All Phase 4 innovations (Replay Vault, Friendfluence, Voice Intro, Guardian Net) are toggleable via `app_config` without code changes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, shadcn-ui, Tailwind CSS, Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage) |
| Video | Agora RTC SDK |
| Payments | Stripe (Checkout, Billing Portal, Webhooks) |
| AI | Lovable AI Gateway (Gemini 2.5 Flash Lite) |
| Testing | Vitest, Testing Library |

---

## Development

Package manager policy: `npm` is the canonical toolchain for local dev and CI.

```sh
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Build
npm run build
```

### Auth Provider Policy

- Canonical Cloud project: `itdzdyhdkbcxbqgukzis`
- Runtime policy source: `public.app_config` row `key='auth_policy'`
- Phone verification mode: `value_json.require_phone_verification` (served via `get-feature-flags`)
- Phase 4 feature toggles: `value_json.enable_replay_vault`, `enable_friendfluence`, `enable_voice_intro`, `enable_guardian_net`
- Optional Google login enforcement: `VITE_REQUIRE_GOOGLE_AUTH=true`
