# Verity — Production Deployment Status

**Last deployment:** March 13, 2026  
**Production URL:** https://getverity.com.au  
**Build hash:** `index-B_vy-ri8.js`  
**Platform:** Lovable (manages deploys + Supabase)

## What Changed (Marketing Overhaul — March 13, 2026)

### Auth
- Removed password fields entirely → magic link only
- Clean single-field form: email + "Send magic link"

### Hero Section
- New headline: "Meet someone real in 45 seconds."
- Waitlist email capture form replaces old "RSVP" flow
- Trust chips: 18+ VERIFIED, NO VIDEO STORED, MUTUAL CONSENT ONLY

### Features
- Merged to 5 features in 3+2 grid
- Title: "What nobody else is building"

### Stats
- 3 Forbes Health statistics on dating fatigue

### Navigation
- "Get started" CTA (was "RSVP for the next Drop")
- Clean nav: How it works | Drops | Safety | Pricing

### Pricing
- $9.99/month Founding Member price (was $14.99)
- "FOUNDING MEMBER" badge on paid tier

### Drops
- Waitlist mode: "First Drop coming soon"
- No RSVP buttons — notify me form instead

### About
- Elevated founder story
- "Built by one person who was tired of what dating apps became"

### Footer
- Simplified links
- "Built by one person in Australia"

## Waitlist Database
- Table: `public.waitlist` in Supabase (`itdzdyhdkbcxbqgukzis`)
- RLS: Anonymous INSERT allowed, SELECT blocked for non-service roles
- Unique constraint on email column
- Successfully tested: inserts work, duplicates return 23505

## Architecture
- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn-ui
- **Backend:** Supabase (auth, database, RLS, edge functions)
- **Video:** Agora RTC (45-second anonymous calls)
- **Payments:** Stripe ($9.99/month Verity Pass)
- **Hosting:** Lovable CDN → getverity.com.au

## Code Repositories
- **Lovable project:** https://lovable.dev/projects/a81e90ba-a208-41e2-bf07-a3adfb94bfcb
- **This repo (GetVerity.1):** Documentation + Phase 1-6 QA work
- **Lovable auto-syncs** to its own GitHub repo (managed by lovable-dev bot)

## Mobile Responsiveness
- Grade: A- (95/100)
- All sections stack properly at 375px
- Hamburger menu functional
- Forms usable on mobile
