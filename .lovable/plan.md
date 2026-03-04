

## Phase 2: Public Marketing Pages, SEO Schemas, Hero/Navbar Updates, Sitemap

### Overview
Create 6 new public pages, update landing page hero with spec-aligned headline and trust chips, expand navbar and footer with new links, add SEO schemas (FAQPage, Organization), and generate sitemap.xml. No Agora/Stripe imports on any public page.

---

### 1. New Pages (6 files to create)

**`src/pages/HowItWorks.tsx`** — Standalone full-page version
- Reuses the same 4-step content from `HowItWorksSection.tsx` but as a dedicated page with back nav, Helmet SEO tags, and expanded descriptions
- Adds a "Get verified" CTA at bottom
- Visual: vertical timeline layout with step cards

**`src/pages/Safety.tsx`** — Safety Promise page
- Heading: "Built for safety — not virality."
- Sections: No recordings ever, Mutual consent reveal, 18+ verification required, AI moderation with human appeal, One-tap exit + report, Zero tolerance policy, Guardian Net safety sharing
- Link to `/transparency` for live stats
- Link to `/privacy` for data details

**`src/pages/Terms.tsx`** — Terms of Service
- Standard ToS sections: Eligibility (18+), Account, Acceptable Use, Privacy, Intellectual Property, Limitation of Liability, Termination, Governing Law (Australia), Contact
- Last updated: March 2026

**`src/pages/FAQ.tsx`** — FAQ with FAQPage JSON-LD
- 7 questions from spec: Is it anonymous if it's video? Is anything recorded? How does Spark work? How do you verify 18+? What data do you keep? How do you handle bad actors? Can I delete my data?
- Uses shadcn Accordion component
- Injects `<script type="application/ld+json">` FAQPage schema via react-helmet

**`src/pages/Drops.tsx`** — Public Drops schedule (read-only)
- Shows themed Drop rooms from `src/data/rooms.ts` with peak hours and descriptions
- "RSVP" CTAs link to `/auth`
- No auth required to view
- Helmet with unique title/description

**`src/pages/Pricing.tsx`** — Free vs Verity Pass comparison
- Two-tier card layout: Free (Drops, Spark/Pass, basic chat) vs Verity Pass (Spark Reflection AI, Chemistry Vault, priority RSVP, advanced safety)
- "Cancel anytime" copy
- CTA links to `/auth`
- No Stripe imports (just static pricing page; checkout happens post-auth)

---

### 2. Hero Section Updates (`HeroSection.tsx`)

- Update H1 to spec: "Anonymous 45-second video dates. Reveal only with mutual Spark."
- Update subhead: "Verified 18+. No profiles. No swiping. Just eyes + voice for 45 seconds — then you both choose: Spark or walk. Dignity either way."
- Primary CTA: "RSVP for the next Drop" → `/auth`
- Secondary CTA: "How it works" → `/how-it-works`
- Add trust chips row above fold (inline badges): "18+ verified" · "No video stored" · "Mutual consent reveal" · "One-tap exit + report" · "Scheduled Drops (no infinite scroll)"

---

### 3. Navbar Updates (`Navbar.tsx`)

Replace current links with spec nav:
- Links: How it works (`/how-it-works`), Drops (`/drops`), Safety (`/safety`), Pricing (`/pricing`)
- Primary CTA button: "RSVP for the next Drop" → `/auth`
- Secondary: "Sign in" text link → `/auth`
- Remove ThemeToggle from nav (keep dark theme default)
- Add mobile hamburger menu for the expanded nav

---

### 4. Landing Page — New Trust/Safety Section

**Create `src/components/landing/TrustSection.tsx`**
- Heading: "Built for safety — not virality."
- Bullet list: no recordings, mutual consent reveal, verification required, report/exit, zero tolerance
- CTA button: "Read the Safety Promise" → `/safety`
- Insert between InnovationsSection and CTASection in `Landing.tsx`

---

### 5. Footer Updates (`Footer.tsx`)

Add new links to the footer nav:
- How it works, Safety, Terms, FAQ, Pricing, Drops
- Keep existing: About, Transparency, Privacy
- Keep trust signals line

---

### 6. Route Registration (`App.tsx`)

Add 6 new lazy-loaded routes (all public, no ProtectedRoute wrapper):
```
/how-it-works → HowItWorks
/safety → Safety
/terms → Terms
/faq → FAQ
/drops → Drops
/pricing → Pricing
```

---

### 7. SEO — Organization JSON-LD (`index.html`)

Add Organization schema alongside existing WebApplication schema:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Verity",
  "url": "https://getverity.com.au",
  "logo": "https://getverity.com.au/og-logo.png",
  "sameAs": [],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "privacy@getverity.com.au",
    "contactType": "customer support"
  }
}
```

---

### 8. Sitemap (`public/sitemap.xml`)

Static sitemap listing all public routes:
```
/ /about /how-it-works /safety /privacy /terms /faq /drops /pricing /transparency
```

Update `robots.txt` to reference sitemap.

---

### Files to create (8)
- `src/pages/HowItWorks.tsx`
- `src/pages/Safety.tsx`
- `src/pages/Terms.tsx`
- `src/pages/FAQ.tsx`
- `src/pages/Drops.tsx`
- `src/pages/Pricing.tsx`
- `src/components/landing/TrustSection.tsx`
- `public/sitemap.xml`

### Files to edit (6)
- `src/components/landing/HeroSection.tsx` — new headline, trust chips
- `src/components/landing/Navbar.tsx` — expanded nav + mobile menu
- `src/components/landing/Footer.tsx` — new links
- `src/pages/Landing.tsx` — add TrustSection
- `src/App.tsx` — 6 new routes
- `index.html` — Organization JSON-LD
- `public/robots.txt` — sitemap reference

### No DB migrations needed.

