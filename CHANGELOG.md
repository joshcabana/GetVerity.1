# Changelog

All notable changes to the Verity project.

---

## [Phase 6] — QA Audit & Production Hardening (March 9–12, 2026)

### Security
- Fixed RLS on `user_blocks`: changed from `public` to `authenticated` role
- Fixed RLS on `chemistry_replays`: changed from `public` to `authenticated` role
- Restored public read access on `platform_stats` (was incorrectly restricted)
- Verified all 66 RLS policies across 26 tables

### Code Quality
- 0 TypeScript errors
- 0 ESLint errors
- 0 console.log statements in production code
- 0 exposed secrets or hardcoded URLs
- Removed dead code and unused imports

### Testing
- Expanded test suite from 33 to 74 tests across 15 suites
- Added edge function security tests
- Added bundle optimization tests
- Added rate limit utility tests

### Production Verification
- All 22 edge functions verified operational (correct 401/400/200 responses)
- All 12 public routes verified HTTP 200
- Security headers confirmed (HSTS, X-Content-Type-Options, Referrer-Policy)
- SMTP confirmed working (signup confirmation emails delivered)
- Deep line-by-line code audit of all edge functions
- Visual UX inspection of all public pages — no issues found

### Fixes
- Fixed Transparency page GitHub link (pointed to wrong repo)
- Added cancellation guards to all async useEffect hooks
- Added noindex meta to protected pages

### Build
- Deployed production build: `index-BsLfjy75.js`

---

## [Phase 5] — Operations & Polish (March 4–8, 2026)

### Features
- Push notification system (VAPID keys, service worker, Web Push API)
- Automated platform stats aggregation (`aggregate-stats` edge function)
- Agora Cloud Recording (`start-cloud-recording`, `stop-cloud-recording`)
- Chemistry Replay Vault (table, UI, `generate-replay` edge function)
- About page with founder story
- Admin Pilot Metrics dashboard
- Unread message count badge

### SEO
- JSON-LD structured data on landing page and legal pages
- Open Graph and Twitter Card meta tags
- Canonical URLs
- Noscript fallback content

### Performance
- Bundle optimization via `manualChunks` in Vite config
- Lazy loading for all routes via React.lazy + Suspense
- Agora SDK code-split into separate chunk (loaded only on call pages)
- Initial load reduced to ~169KB gzip

---

## [Phase 4] — Innovations (March 2–4, 2026)

### Features (all feature-flagged via `app_config`)
- **Friendfluence Drops** — Invite friends to shared Drops (`generate-friend-invite`)
- **Spark Reflection AI** — Post-call AI coaching insight (`spark-reflection-ai`)
- **Voice Intros** — 15-second voice notes before text chat
- **Guardian Net** — One-tap safe-call signal to trusted friend
- **Chemistry Replay Vault** — 8-second highlight reels from mutual-spark calls

### Infrastructure
- Feature flag system (`get-feature-flags` edge function + `app_config` table)
- Runtime feature toggles without code deployment

---

## [Phase 3] — Payments & Premium (Feb 28 – March 2, 2026)

### Features
- Token shop with 3 packs (10, 15, 30 tokens)
- Verity Pass subscriptions (monthly and annual)
- Stripe Checkout integration with server-side price-ID allowlist
- Stripe Billing Portal (`customer-portal`)
- Stripe webhook handler with idempotency (`stripe-webhook`)
- Atomic token operations via SQL RPCs (`add_tokens`, `deduct_tokens`)
- Token transaction history (`token_transactions` table)

### Security
- Price-ID allowlist prevents arbitrary Stripe price injection
- Server-built redirect URLs prevent open redirect attacks
- Customer-ID mapping for deterministic Stripe lookups
- Webhook signature verification with `constructEventAsync`

---

## [Phase 2] — Safety & Infrastructure (Feb 27–28, 2026)

### Features
- AI moderation via Gemini 2.5 Flash Lite (`ai-moderate`)
- Matchmaking queue with atomic claim via SQL RPC (`find-match`)
- User blocking system (`user_blocks` table)
- Admin dashboard: moderation queue, appeals inbox, analytics
- Transparency page: live safety stats, founding principles
- Appeal submission flow (`submit-appeal`)
- Admin moderation actions (`admin-moderation`)
- Profile page with avatar upload, verification badges

### Security
- JWT authentication on all edge functions
- Admin role verification via `user_roles` table
- UUID validation on all ID inputs
- Rate limiting on all user-facing endpoints

---

## [Phase 1] — Core Platform (Feb 24–27, 2026)

### Features
- User authentication (email/password via Supabase Auth)
- 8-step onboarding: welcome → age → phone → selfie → safety pledge → preferences → profile → complete
- Lobby with Drop discovery, RSVP management, real-time participant counts
- Anonymous 45-second video calls via Agora RTC
- Canvas pixelation for anonymous video (privacy by design)
- Spark/Pass decision mechanic
- Mutual-spark identity reveal with confetti animation
- Spark history with partner info and AI insights
- Real-time post-match chat with read receipts

### Infrastructure
- Supabase project setup (PostgreSQL, Auth, Storage, Edge Functions)
- Database schema: profiles, user_trust, rooms, drops, calls, sparks, messages
- Row-level security policies
- Supabase Realtime subscriptions for drops, RSVPs, calls, messages
