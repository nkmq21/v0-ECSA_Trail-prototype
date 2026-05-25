# Sprint 6 — PWA · Public Routes · Settings · Polish · Production

**Week:** 6  
**Goal:** Lighthouse PWA audit passes. Public-facing routes (marketplace, plan preview) work without login. All dashboard routes have loading skeletons. App is production-deployable: security reviewed, no known broken flows, performance acceptable.  
**Prerequisite:** Sprint 5 complete — payment, gamification, place ingest all functional.

---

## Dev A — PWA · Performance · Security · Public Routes · Settings Backend

### Day 1: PWA setup

**Install:**
```bash
pnpm add next-pwa
```

**`next.config.ts`** — wrap with next-pwa:
```ts
import withPWA from 'next-pwa'
const nextConfig = { ... }
export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    { urlPattern: /^https:\/\/fonts\.googleapis\.com/, handler: 'CacheFirst' },
    { urlPattern: /^https:\/\/maps\.googleapis\.com/, handler: 'NetworkFirst' },
    { urlPattern: /\/api\//, handler: 'NetworkOnly' },
  ],
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
```

**`public/manifest.json`**:
```json
{
  "name": "ECSATrail — Vietnam Travel Planner",
  "short_name": "ECSATrail",
  "description": "AI-powered Vietnam travel companion",
  "start_url": "/marketplace",
  "display": "standalone",
  "background_color": "#F8F9FA",
  "theme_color": "#228BE6",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-any-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" }
  ]
}
```

**`public/icons/`** — generate maskable icons (use maskable.app or squoosh):
- `icon-192.png`, `icon-512.png` (maskable — safe zone used)
- `icon-any-192.png` (any — full bleed ECSATrail logo)

**`<link rel="manifest">` + `<meta name="theme-color">` in `src/app/layout.tsx`.**

### Day 1–2: Offline caching — plan + place data

**`public/sw.js`** — extend the minimal SW from Sprint 4:
```js
// Cache plan JSON when user opens itinerary (plan-open event)
const PLAN_CACHE = 'ecsa-plans-v1'
const MAP_TILE_CACHE = 'ecsa-tiles-v1'

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_PLAN') {
    const { purchasedPlanId, stops, places } = event.data
    caches.open(PLAN_CACHE).then(cache => {
      cache.put(`/plan-data/${purchasedPlanId}`, new Response(JSON.stringify({ stops, places })))
    })
  }
  if (event.data?.type === 'CACHE_MAP_TILES') {
    // Pre-cache Google Maps static tile URLs for bounding box of trip stops
    const { tileUrls } = event.data
    caches.open(MAP_TILE_CACHE).then(cache => Promise.all(tileUrls.map(url => cache.add(url).catch(() => null))))
  }
})

// Serve cached plan data when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/plan-data/')) {
    event.respondWith(caches.match(event.request).then(r => r ?? fetch(event.request)))
  }
})
```

**`src/hooks/usePlanCache.ts`**:
```ts
// Called when ItineraryWrapper mounts
// Posts 'CACHE_PLAN' message to SW with serialized stops + places
// Posts 'CACHE_MAP_TILES' with bounding-box tile URLs
export function usePlanCache(purchasedPlanId: string, stops: PurchasedStop[]) {
  useEffect(() => {
    if (!navigator.serviceWorker?.controller) return
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_PLAN', purchasedPlanId,
      stops: stops.map(s => ({ id: s.id, stopOrder: s.stop_order, placeId: s.place_id })),
      places: stops.map(s => s.place),
    })
    // Compute bounding box from stops[].place.lat/lng + generate tile URLs
    const tileUrls = computeMapTileUrls(stops)
    navigator.serviceWorker.controller.postMessage({ type: 'CACHE_MAP_TILES', tileUrls })
  }, [purchasedPlanId])
}
```

### Day 2–3: Public routes

**`src/app/(public)/marketplace/page.tsx`** — public marketplace (no auth):
- Server Component — calls `getPlans` (no userId, global cache `_mkt`)
- Same `MarketplaceClient` but: "Buy" button → redirect to login if no session (check via `createClient().auth.getUser()`)
- No wallet UI, no `UserContext` needed for display

**`src/app/(public)/plan/[id]/page.tsx`** — public plan preview:
```tsx
// Server Component, calls getPlanById(id)
// Shows: plan details, stop list, creator profile, reviews
// AI features gated: "Chat about this plan" → login CTA
// "Get this plan" → login CTA (or purchase if logged in)
// generateStaticParams: pre-render top 20 published plans at build time
// revalidate: 3600 (ISR — refresh hourly)
```

**`src/app/(public)/layout.tsx`** — public layout:
- No dashboard shell — just header with logo + login button + language toggle
- `ResponsiveLink` for all nav items

**`src/app/(public)/(auth)/` routes** — already built Sprint 1. Verify Google OAuth flow end-to-end.

### Day 3–4: Settings page

```
src/app/(dashboard)/dashboard/settings/
├── page.tsx
├── SettingsPageShell.tsx
└── loading.tsx
src/components/sections/settings/
├── ProfileSettings.tsx     ← name, bio, avatar upload, province
├── PrivacySettings.tsx     ← data disclosure, trip background processing consent
├── NotificationSettings.tsx ← push notification opt-in/out
└── DangerZone.tsx          ← account deletion (disabled if active trip)
```

**`src/services/profile/updateProfile.ts`**:
```ts
// withServerAction(UpdateProfileSchema, async (params, { userId }) => {
//   UPDATE profile SET name, bio, avatar_url, province WHERE id = userId
//   revalidateTag(`usr_${userId}_usr_all`)  // if admin view exists
// })
```

**`src/schemas/profile.ts`**:
```ts
export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(80),
  bio: z.string().max(500).optional(),
  province: z.string().optional(),
})
```

**Privacy disclosure (SRS §6.3)** — `PrivacySettings.tsx`:
```tsx
// Required: explicit consent toggle for autonomous re-planning background processing
// If user disables: trip.push_subscription cleared, poller skips this user
// Text: "ECSATrail AI monitors weather conditions for your active trip every 3 hours.
//        Disable this to stop background processing."
```

**Avatar upload** — Supabase Storage:
- Bucket: `avatars` (public read, auth write)
- `src/services/profile/uploadAvatar.ts` — uploads file, returns public URL, updates `profile.avatar_url`

### Day 4–5: Security audit + performance

**Security checklist:**
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in client-side code (grep: `NEXT_PUBLIC_SUPABASE_SERVICE`)
- [ ] No `GEMINI_API_KEY` in client bundle (grep: `NEXT_PUBLIC_GEMINI`)
- [ ] SePay webhook signature verified in all cases (test with wrong signature → 401)
- [ ] RLS enabled on all 14 tables — verify via `supabase db lint`
- [ ] PII redaction tested: credit card number in chat input → `[REDACTED]` before Gemini call
- [ ] All Server Actions protected by `withServerAction` (no unguarded `'use server'` exports)
- [ ] `createAdminClient()` only called in: `'use cache'` functions and Edge Functions
- [ ] `place-ingest` EF: Google Places API key not exposed in response

**Performance:**
- Run `pnpm build` — check bundle sizes. Any page chunk > 250kB → investigate
- Add `loading.tsx` for any dashboard route missing it
- Verify PPR works for marketplace (static shell + dynamic plans)
- `next/image` for all plan cover images + place images
- Mantine `lazyLoad` on Carousel if used

---

## Dev B — Loading States · Responsive · Framer Polish · Remaining AI Tools

### Day 1: Loading skeletons for all routes

**Pattern — Mantine `Skeleton` for each route:**
```tsx
// src/app/(dashboard)/dashboard/[route]/loading.tsx
import { Skeleton } from '@mantine/core'
export default function Loading() {
  return <div className="..."><Skeleton height={200} /><Skeleton height={80} mt="md" /></div>
}
```

Routes needing `loading.tsx` (verify each exists):
- `dashboard/chat/loading.tsx`
- `dashboard/itinerary/[purchasedPlanId]/loading.tsx`
- `dashboard/my-plans/loading.tsx`
- `dashboard/create/loading.tsx`
- `dashboard/subscription/loading.tsx`
- `dashboard/settings/loading.tsx`
- `(public)/marketplace/loading.tsx`
- `(public)/plan/[id]/loading.tsx`

Also add `error.tsx` for each dashboard route (Mantine `Alert` error state with retry button).

### Day 2: Responsive testing + mobile fixes

**Breakpoints to test (Mantine defaults: xs=36em, sm=48em, md=62em):**

**ChatPanel** — mobile: full-screen, no split with map  
**PlannerLayout** — mobile: Mantine `Tabs` (Map | Timeline) instead of side-by-side  
**Marketplace** — mobile: single column grid (`cols={{ base: 1, sm: 2, lg: 3 }}`)  
**Creator Studio** — mobile: form stacks vertically  
**NavBar** — mobile: burger → Mantine `Drawer` navigation  

**Touch interactions:**
- Stop cards swipeable on mobile (dismiss gesture for challenges)
- Map markers tappable with appropriate hit target (44×44px minimum)
- All modals scroll correctly on small screens (Mantine `Modal` with `scrollAreaComponent`)

### Day 2–3: Framer Motion polish

**Page transitions** — `src/components/layouts/PageTransition.tsx`:
```tsx
'use client'
import { motion } from 'framer-motion'
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```
Wrap each dashboard page shell with `PageTransition`.

**Chat `LayoutGroup`** — ensure chat bubbles animate smoothly as new messages arrive. `LayoutGroup` wraps the messages list — no layout jump when new bubble inserts.

**ECSATrailLogo thinking animation** — verify pulsing gradient `#7048E8 → #228BE6`:
```tsx
<motion.div
  animate={thinking ? { opacity: [0.6, 1, 0.6], scale: [0.97, 1, 0.97] } : {}}
  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
>
  {/* Logo SVG with gradient fill */}
</motion.div>
```

**StopCard entrance** — staggered animation already in prototype, verify with real data (delay × index still smooth at 10+ stops).

**Plan A→B transition** — `AnimatePresence mode="popLayout"` on stops list — stops animate out/in when switching between Plan A and Plan B views.

### Day 3–4: Premium-gated AI tools

**`src/lib/ai/tools/addToCalendar.ts`**:
```ts
export async function addToCalendar(params: AddToCalendarInput, tier: AiUserTier) {
  if (tier !== 'premium') throw new AppError(AppErrorCodes.AI_PREMIUM_REQUIRED, 'Calendar export requires AI Premium')
  // Generate iCal events for each stop
  // Return: { icalData: string }  — client downloads as .ics file
}
```

**`src/lib/ai/tools/exportItinerary.ts`**:
```ts
export async function exportItinerary(params: ExportItineraryInput, tier: AiUserTier) {
  if (tier !== 'premium') throw new AppError(AppErrorCodes.AI_PREMIUM_REQUIRED, 'PDF export requires AI Premium')
  // Use @react-pdf/renderer or puppeteer-minimal to generate PDF
  // Return: { pdfBase64: string }
}
```

**`src/components/ai/PremiumGateModal.tsx`**:
```tsx
// Shown when AI_PREMIUM_REQUIRED error returned from tool
// "This feature requires AI Premium" with tier card + upgrade CTA
// CTA → router.push('/dashboard/subscription')
```

### Day 4–5: End-to-end testing + bug fixing

**Critical paths to verify manually:**

1. **New user signup** → profile created → arrives at marketplace
2. **Browse marketplace** → open plan detail → purchase plan → appears in My-Plans
3. **Start trip** → itinerary loads with stops + map → challenge visible per stop
4. **Complete challenge** → EXP increases → level badge updates → points balance increases
5. **Redeem voucher** → points decrease → redemption appears in "My Redemptions"
6. **AI chat** → generates itinerary → save → appears in My-Plans
7. **Weather alert** (trigger manually via SQL) → banner appears → accept Plan B → timeline switches → push notification received
8. **SePay payment** (sandbox) → QR displayed → webhook triggered → subscription active → premium model used in chat
9. **Offline** → open plan, disconnect network → plan still readable
10. **Mobile** → complete paths 1–3 on 375px viewport

**Lighthouse audit** (run via Chrome DevTools > Lighthouse):
- PWA: ≥ 90 (target 100)
- Performance: ≥ 70
- Accessibility: ≥ 85
- Fix any failing PWA criteria (manifest, SW, HTTPS in prod)

---

## Sprint 6 Definition of Done

- [ ] Lighthouse PWA score ≥ 90 in production build
- [ ] All 10 critical paths manually verified without errors
- [ ] `loading.tsx` + `error.tsx` on every dashboard route
- [ ] Public `/marketplace` and `/plan/[id]` work without login
- [ ] Settings: profile update, push toggle, privacy consent all save correctly
- [ ] Offline: previously opened plan readable with no network
- [ ] `pnpm build` + `npx.cmd tsc --noEmit` both pass clean
- [ ] Security checklist: all 8 items checked
- [ ] No console errors or warnings in production build
- [ ] `addToCalendar` + `exportItinerary` tools throw `AI_PREMIUM_REQUIRED` for free users

## Stretch Goals

- Lighthouse Performance ≥ 85 (requires image optimization + bundle splitting audit)
- Business API route (`src/app/api/v1/plans/route.ts`) — returns public plan JSON for affiliates
- Leaderboard page (`/dashboard/leaderboard`)
- Creator plan cover image upload (Supabase Storage)
- i18n: full Vietnamese translation audit (all `t()` keys covered, no English fallbacks in VI mode)
