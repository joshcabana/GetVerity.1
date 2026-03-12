# Verity — Comprehensive Project Examination

*Last updated: March 12, 2026*

> **Production-Ready** — All six phases complete. QA audit passed. Deployed at [getverity.com.au](https://getverity.com.au).

---

## 1. Primary Objectives & Intended Outcomes

Verity is a verified, safety-first speed-dating platform built around 45-second anonymous video "Drops" and a mutual Spark/Pass reveal model. The project pursues six core objectives:

1. **Authentic first impressions** — Replace swipe-based profile browsing with live 45-second video calls that surface real voice, eye contact, and presence.
2. **Zero ghosting by design** — The mutual-spark gate means identities are revealed only when both participants choose "Spark." A "Pass" is silent and private, eliminating rejection exposure.
3. **Safety-first architecture** — Real-time AI moderation during calls, server-verified identity gates (phone, selfie, safety pledge), and one-tap Safe Exit and Guardian Net for immediate protection.
4. **Privacy by default** — Participants are anonymous during the 45-second call. Video is pixelated via canvas processing. Personal information is withheld until mutual consent.
5. **Radical transparency** — A public Transparency page exposes platform safety statistics, moderation accuracy, appeals outcomes, and founding principles.
6. **Intention over addiction** — Scheduled Drops replace infinite scroll. No dopamine loops, no dark-pattern engagement mechanics. Revenue comes from token packs and Verity Pass subscriptions.

---

## 2. Architecture & Technology Stack

### 2.1 System Overview

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite + TypeScript | 24 pages, 116 components, all routes lazy-loaded |
| **UI** | shadcn/ui + Tailwind CSS + Framer Motion | Dark theme, responsive, Sonner toasts |
| **State** | React Query + AuthContext + Supabase Realtime | Server cache via TanStack Query; live subscriptions for drops, messages, queue |
| **Backend** | Supabase (PostgreSQL + RLS) | 26 tables, 6 enums, 66 RLS policies, 10+ RPC functions |
| **Edge Functions** | 22 Deno functions on Supabase | Matchmaking, video auth, AI moderation, payments, GDPR, push, stats |
| **Video** | Agora RTC SDK | 45s sessions, server-issued tokens (10-min expiry), anonymized canvas pixelation |
| **Payments** | Stripe | Checkout, Billing Portal, Webhooks with idempotency |
| **AI** | Lovable AI Gateway (Gemini 2.5 Flash Lite) | Tool-use moderation + post-call reflection |
| **Push** | Web Push API (VAPID) | Browser notifications for matches and reminders |
| **Hosting** | Cloudflare (frontend) + Supabase Cloud (backend) | Custom domain: getverity.com.au |
| **Testing** | Vitest + Testing Library | 15 suites, 74 tests |

### 2.2 Database Schema (26 Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles: display name, avatar, age, city, gender, bio, token balance, subscription tier |
| `user_trust` | Onboarding verification state: phone verified, selfie verified, safety pledge, DOB, preferences |
| `user_roles` | Role-based access: `admin`, `moderator`, `user` |
| `user_blocks` | Bidirectional user blocking for matchmaking exclusion |
| `user_payment_info` | Stripe customer ID mapping for deterministic payment lookups |
| `rooms` | Themed rooms with categories, descriptions, icons, gender balance tracking |
| `drops` | Scheduled speed-dating events: title, region, timezone, capacity, duration, Friendfluence flag |
| `drop_rsvps` | User RSVPs for drops with check-in status and friend invite codes |
| `matchmaking_queue` | Atomic queue entries: user/room/drop, status tracking, matched call reference |
| `calls` | Video call records: caller/callee, Agora channel, timing, decisions, cloud recording metadata |
| `sparks` | Mutual spark connections: linked call, AI insight, voice intro URLs, expiry |
| `messages` | Post-spark chat: text and voice messages with read receipts |
| `spark_reflections` | Private post-call reflections with AI-generated insight |
| `chemistry_vault_items` | Personal chemistry notes linked to sparks and reflections |
| `chemistry_replays` | 8-second highlight reels from mutual-spark calls |
| `moderation_flags` | AI and human moderation flags: flagged user, call, reason, AI confidence, action taken |
| `moderation_events` | Detailed moderation event log: call, risk score, action, metadata |
| `reports` | User-submitted reports: reason, reported user, call, review status |
| `appeals` | User appeals against moderation decisions: explanation, voice note, admin response |
| `guardian_alerts` | Guardian Net safe-call signals logged during live calls |
| `token_transactions` | Token credit/debit ledger: amount, reason, Stripe session reference |
| `push_subscriptions` | Web push notification subscriptions: endpoint, keys |
| `platform_stats` | Aggregated platform metrics: users, calls, sparks, moderation, gender balance |
| `stripe_processed_events` | Webhook idempotency: prevents duplicate processing of Stripe events |
| `app_config` | Runtime configuration: auth policy, feature flags |
| `runtime_alert_events` | System-level alert log: level, message, metadata |

### 2.3 Edge Functions (22)

| Function | Auth | Responsibility |
|----------|------|---------------|
| `find-match` | JWT | Atomic matchmaking with row-level locks, trust gate, block filtering |
| `agora-token` | JWT | RTC tokens with 10-min expiry, call participation verified |
| `agora-demo-token` | Public | Demo tokens for GreenRoom device testing |
| `ai-moderate` | JWT | Real-time AI moderation via Gemini with structured risk scoring |
| `spark-reflection-ai` | JWT | Post-call AI coaching insight generation |
| `create-checkout` | JWT | Stripe Checkout with price-ID allowlist, server-built URLs |
| `customer-portal` | JWT | Stripe Billing Portal with URL validation |
| `stripe-webhook` | Signature | Idempotent webhook: checkout, subscription lifecycle, invoice |
| `check-subscription` | JWT | Subscription status check |
| `spark-extend` | JWT | Extend spark expiry with atomic token deduction |
| `submit-appeal` | JWT | Moderation appeal submission with validation |
| `admin-moderation` | JWT+Admin | Admin appeal review (approve/deny) |
| `send-push` | Service/Admin | Web Push dispatch with stale subscription cleanup |
| `generate-friend-invite` | JWT | Friendfluence invite code generation |
| `generate-replay` | JWT | Chemistry replay record creation |
| `start-cloud-recording` | JWT | Agora Cloud Recording acquire + start |
| `stop-cloud-recording` | JWT | Agora Cloud Recording stop + URL extraction |
| `delete-account` | JWT | GDPR account deletion (RPC + auth user delete) |
| `export-my-data` | JWT | GDPR data export with partner redaction |
| `aggregate-stats` | Service | Automated platform statistics aggregation |
| `get-feature-flags` | Public | Feature flag retrieval from `app_config` |
| `generate-vapid-keys` | Public | VAPID key pair generation |

### 2.4 Security Model

| Layer | Implementation |
|-------|---------------|
| Authentication | JWT verification via `supabase.auth.getUser()` or `getClaims()` on all endpoints |
| Authorization | Admin role double-checked via `user_roles` table; trust gates for call participation |
| Input validation | UUID regex on all IDs, price allowlists, length limits, URL validation |
| Rate limiting | Per-user/IP limits on all endpoints (2–20 req/min depending on action) |
| CORS | Restricted to 3 origins: `getverity.com.au`, Lovable preview, Lovable app |
| Payment security | Server-side price-ID allowlist, server-built redirect URLs, webhook signature verification |
| Idempotency | `stripe_processed_events` table prevents duplicate processing |
| Token operations | Atomic SQL RPCs (`add_tokens`, `deduct_tokens`) prevent race conditions |
| Matchmaking | `claim_match_candidate` RPC with row-level locks prevents double-matching |
| Privacy | Canvas-pixelated video during anonymous calls; partner info redacted in data exports |
| Fail-open | AI moderation and feature flags fail open with safe defaults |

---

## 3. Development Phases

### Phase 1 — Core Platform ✅
Auth, 8-step onboarding, lobby/drops, Agora video calls, 45s timer, Spark/Pass mechanic, mutual-spark reveal, spark history, post-match chat.

### Phase 2 — Safety & Infrastructure ✅
AI moderation (real LLM), matchmaking queue with block filtering, selfie verification, admin dashboard, transparency page, appeals flow, user blocking.

### Phase 3 — Payments & Premium ✅
Token shop (3 packs: 10/15/30 tokens), Verity Pass subscriptions (monthly/annual), Stripe Checkout + Customer Portal + webhook handler with idempotency.

### Phase 4 — Innovations ✅ (Feature-Flagged)
Friendfluence Drops, Spark Reflection AI, Voice Intros, Guardian Net, Chemistry Replay Vault — all toggled via `app_config` without code changes.

### Phase 5 — Operations & Polish ✅
Push notifications (VAPID/Web Push), automated stats aggregation, SEO (JSON-LD, OG tags, canonical), bundle optimization (manual chunks, lazy loading), Agora Cloud Recording, About page.

### Phase 6 — QA Audit & Production Hardening ✅ ← CURRENT
- 9-phase comprehensive quality audit
- RLS policy verification: 66 policies across 26 tables
- 3 RLS fixes applied: `user_blocks` (public→authenticated), `chemistry_replays` (public→authenticated), `platform_stats` (restored public read)
- Transparency page GitHub link corrected
- Full code quality scan: 0 TypeScript errors, 0 ESLint errors, 0 console.logs, 0 exposed secrets
- Test suite expanded: 15 suites, 74 tests passing
- All 22 edge functions verified operational
- All 12 public routes verified HTTP 200
- Security headers confirmed: HSTS, X-Content-Type-Options, Referrer-Policy
- SMTP verified working (confirmation emails delivered)
- Production build deployed: `index-BsLfjy75.js`
- Deep code audit: line-by-line review of all edge functions for error handling, race conditions, input validation, and security

---

## 4. Current Production State (March 12, 2026)

| Check | Result |
|-------|--------|
| TypeScript | 0 errors |
| ESLint | 0 errors |
| Test suites | 15 passing |
| Tests | 74 passing |
| Edge functions | 22/22 responding correctly |
| RLS policies | 66 verified |
| Public routes | 12/12 HTTP 200 |
| Security headers | HSTS, nosniff, referrer-policy |
| Build deployed | `index-BsLfjy75.js` |
| SMTP | Working (confirmation emails) |
| Visual inspection | All pages render correctly |

### Performance

| Metric | Value |
|--------|-------|
| Initial load (gzip) | ~169 KB |
| Agora SDK | 1.3 MB (lazy-loaded on call pages only) |
| Charts | 401 KB (lazy-loaded on admin/transparency only) |
| Pages lazy-loaded | All 24 via React.lazy + Suspense |
| Route response time | < 1.1s (all routes) |

### Configured Secrets (11 in Lovable)

`AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, `AGORA_CUSTOMER_KEY`, `AGORA_CUSTOMER_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `Google_Gemini`, `OpenAI`, `LOVABLE_API_KEY`

---

## 5. Development Metrics

| Metric | Value |
|--------|-------|
| Total commits | 441 |
| Frontend pages | 24 |
| UI components | 116 |
| Custom hooks | 7 |
| Edge functions | 22 |
| Database tables | 26 |
| Custom enums | 6 |
| RLS policies | 66 |
| Test suites | 15 |
| Tests | 74 |
| Production URL | getverity.com.au |

---

## 6. Remaining Items

### Manual Dashboard Configuration (require account access)
1. Verify Stripe webhook signing secret matches in Stripe Dashboard
2. Add `X-Frame-Options: DENY` and CSP headers via Cloudflare Transform Rules
3. Optional: Add Sentry DSN for error monitoring (`VITE_SENTRY_DSN`)

### Future Development
- Granular drop scheduling (region targeting, capacity management)
- AI moderation threshold tuning with real user data
- Extended analytics and A/B testing framework

---

## 7. Challenges & Mitigations

| Challenge | Resolution |
|-----------|-----------|
| **Payment security** — checkout accepted arbitrary inputs | Rewrote: JWT auth, server-derived email, server-built URLs, price-ID allowlist |
| **Webhook idempotency** — duplicate events caused double credits | Added `stripe_processed_events` table with PK on event_id |
| **Agora stub tokens** — placeholder tokens broke calls | Replaced with `RtcTokenBuilder.buildTokenWithUid` (10-min expiry) |
| **Open redirect** — customer portal accepted arbitrary return URLs | Strict URL parsing + exact-origin allowlist validation |
| **AI moderation stub** — random scores | Upgraded to Gemini 2.5 Flash Lite with structured tool-use |
| **RLS gaps** — `user_blocks` and `chemistry_replays` allowed anon access | Fixed: policies changed from `public` to `authenticated` role |
| **Test coverage** — 1 placeholder test | Expanded to 15 suites, 74 tests |
| **Bundle size** — 2.5MB+ monolith | Lazy loading + manual chunks: 169KB initial load |
