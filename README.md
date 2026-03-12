# Verity — Anonymous Speed Dating Platform

> **Live at [getverity.com.au](https://getverity.com.au)**
> **Status: Production-Ready (Beta Launch)**
> *Last updated: March 12, 2026*

---

## What is Verity?

Verity is a verified, anonymous speed dating platform that replaces swipe culture with real human connection. Users join themed, time-limited "Drops" — scheduled speed dating sessions where they're matched for 45-second anonymous video calls. Both participants independently choose **Spark** or **Pass**. Only a mutual Spark reveals identities and unlocks post-call chat. No rejection notifications, ever.

**The problem:** 78% of dating app users experience burnout. 80% of women report dating fatigue. Ghosting accounts for 41% of that fatigue.

**Verity's answer:** Real eyes, real voice, 45 seconds, and dignity always.

---

## Project Progression

### Phase 1 — Core Platform ✅
User auth, onboarding with identity verification, lobby with live Drops, anonymous video calls via Agora RTC, mutual-spark mechanic, chat system.

### Phase 2 — Safety & Infrastructure ✅
AI moderation (Gemini 2.5 Flash Lite), matchmaking queue with atomicity, user blocking, admin dashboard, transparency page with live stats, appeal system.

### Phase 3 — Payments & Premium ✅
Stripe Checkout (3 token packs + 2 subscription tiers), Billing Portal, webhook handler with idempotency, token balance tracking.

### Phase 4 — Innovations ✅ (Feature-Flagged)
Friendfluence Drops, Spark Reflection AI, Voice Intros, Guardian Net, Chemistry Replay Vault — all toggled via `app_config` without code changes.

### Phase 5 — Operations & Polish ✅
Push notifications (VAPID/Web Push), automated stats aggregation, SEO (JSON-LD, OG tags), bundle optimization, Agora Cloud Recording.

### Phase 6 — QA Audit & Production Hardening ✅ ← Current
Comprehensive 9-phase quality audit, RLS policy verification (66 policies across 26 tables), security hardening, full test suite (74 tests), production deployment and verification.

---

## Current State (March 12, 2026)

| Metric | Value |
|--------|-------|
| TypeScript errors | **0** |
| ESLint errors | **0** |
| Test suites | **15 passing** |
| Tests | **74 passing** |
| Edge functions | **22 deployed & operational** |
| RLS policies | **66 across 26 tables** |
| Public routes | **12/12 returning HTTP 200** |
| Security headers | HSTS, X-Content-Type-Options, Referrer-Policy |
| Build | `index-BsLfjy75.js` deployed |
| SMTP | Custom domain configured, confirmation emails working |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS + Framer Motion |
| State | TanStack React Query + Supabase Realtime |
| Backend | Supabase (PostgreSQL + Auth + RLS + Edge Functions + Storage) |
| Video | Agora RTC SDK (anonymous pixelated video, identity reveal on mutual spark) |
| Payments | Stripe (Checkout, Billing Portal, Webhooks) |
| AI | Lovable AI Gateway (Gemini 2.5 Flash Lite for moderation + reflection) |
| Push | Web Push API with VAPID keys |
| Hosting | Cloudflare (frontend) + Supabase Cloud (backend) |
| Testing | Vitest + Testing Library |

---

## Architecture

### Frontend — 24 Pages, 116 Components
All pages lazy-loaded via `React.lazy` + `Suspense`. Critical path ~169KB gzip. Agora SDK (1.3MB) loaded only on call pages.

**Pages:** Landing, Auth, Onboarding, Lobby, LiveCall, SparkHistory, Chat, TokenShop, Admin, Transparency, Appeal, Profile, Friendfluence, About, HowItWorks, Safety, Privacy, Terms, FAQ, Drops, Pricing, GreenRoom, Settings, NotFound

### Backend — 26 Tables, 6 Enums, 22 Edge Functions

**Tables:**
`profiles` · `user_trust` · `user_roles` · `user_blocks` · `user_payment_info` · `rooms` · `drops` · `drop_rsvps` · `matchmaking_queue` · `calls` · `sparks` · `messages` · `spark_reflections` · `chemistry_vault_items` · `chemistry_replays` · `moderation_flags` · `moderation_events` · `reports` · `appeals` · `guardian_alerts` · `token_transactions` · `push_subscriptions` · `platform_stats` · `stripe_processed_events` · `app_config` · `runtime_alert_events`

**Enums:** `app_role` · `appeal_status` · `call_status` · `moderation_action` · `spark_decision` · `subscription_tier`

**Edge Functions:**
| Function | Purpose |
|----------|---------|
| `find-match` | Atomic matchmaking with row-level locks and trust gate |
| `agora-token` | Server-issued RTC tokens with call participation verification |
| `agora-demo-token` | Demo tokens for GreenRoom device testing |
| `ai-moderate` | Real-time AI moderation with structured risk scoring |
| `spark-reflection-ai` | Post-call AI coaching insight |
| `create-checkout` | Stripe Checkout with price-ID allowlist and server-built URLs |
| `customer-portal` | Stripe Billing Portal with URL validation |
| `stripe-webhook` | Idempotent webhook handler (checkout, subscription, invoice) |
| `check-subscription` | Subscription status check for client |
| `spark-extend` | Extend spark expiry with token deduction |
| `submit-appeal` | Moderation appeal submission |
| `admin-moderation` | Admin appeal review (approve/deny) |
| `send-push` | Web Push notifications (admin/service-role gated) |
| `generate-friend-invite` | Friendfluence invite code generation |
| `generate-replay` | Chemistry replay record creation |
| `start-cloud-recording` | Agora Cloud Recording acquire + start |
| `stop-cloud-recording` | Agora Cloud Recording stop + URL extraction |
| `delete-account` | GDPR account deletion (RPC + auth user delete) |
| `export-my-data` | GDPR data export with partner redaction |
| `aggregate-stats` | Automated platform statistics aggregation |
| `get-feature-flags` | Feature flag retrieval from `app_config` |
| `generate-vapid-keys` | VAPID key pair generation |

### Security Model
- JWT verification on all authenticated endpoints
- Admin role double-checked via `user_roles` table
- UUID regex validation on all ID inputs
- Rate limiting on all user-facing endpoints (2–20 req/min)
- CORS restricted to 3 allowed origins
- Stripe price-ID validated against server-side allowlist
- URL validation prevents open redirect attacks
- Webhook signature verification + idempotency table
- AI moderation fails open (doesn't block calls if AI is down)
- Feature flags fail open with safe defaults
- Atomic SQL RPCs for token operations (prevents race conditions)
- Row-level locks for matchmaking (prevents double-matching)

---

## Development

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

### Environment Variables

See `.env.example` for required variables. In production, these are configured as Lovable secrets:

| Variable | Purpose |
|----------|---------|
| `AGORA_APP_ID` | Agora RTC application ID |
| `AGORA_APP_CERTIFICATE` | Agora RTC token signing |
| `AGORA_CUSTOMER_KEY` | Agora Cloud Recording API auth |
| `AGORA_CUSTOMER_SECRET` | Agora Cloud Recording API auth |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `VAPID_PUBLIC_KEY` | Web Push public key |
| `VAPID_PRIVATE_KEY` | Web Push private key |
| `LOVABLE_API_KEY` | AI Gateway for moderation + reflection |
| `Google_Gemini` | Gemini API key |
| `OpenAI` | OpenAI API key |

---

## Deployment

- **Frontend:** Deployed via Lovable Cloud, served through Cloudflare at `getverity.com.au`
- **Backend:** Supabase Cloud (project: `itdzdyhdkbcxbqgukzis`)
- **Git sync:** One-way from Lovable → GitHub. All code changes go through Lovable's editor.

### Remaining Manual Configuration

1. Verify Stripe webhook signing secret matches in Stripe Dashboard
2. Add `X-Frame-Options` and `Content-Security-Policy` headers via Cloudflare Transform Rules
3. Optional: Add Sentry DSN for error monitoring (`VITE_SENTRY_DSN`)

---

## Commit History

441 commits across 6 development phases. Key milestones:

- `dd98a0e` — Production deploy trigger (current HEAD)
- `419325c` — Seed rooms, Drops, and feature flags for beta
- `bfbae48` — Cancellation guards on all async hooks
- `6f8430a` — QA audit fixes (noindex meta, dead code removal)
- `bc36442` — ESLint zero-errors milestone

---

## License

Proprietary. All rights reserved.
