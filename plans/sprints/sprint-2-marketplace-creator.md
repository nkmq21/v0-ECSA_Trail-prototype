# Sprint 2 — Marketplace & Creator Studio (Real Data)

**Week:** 2  
**Goal:** Marketplace shows real plans from Supabase. Creators can draft, publish, and manage plans. Consumers can browse and purchase. All mock data removed from these two routes.  
**Prerequisite:** Sprint 1 complete — auth working, Mantine installed, `src/` structure in place.

---

## Dev A — Backend: Server Actions, RPCs, Schema, Seed

### Day 1: Place seed data + cursor utility

**`src/utils/cursor.ts`** — cursor-based pagination utility:
```ts
export function encodeCursor(sortValue: unknown, id: string): string {
  return Buffer.from(JSON.stringify({ sortValue, id })).toString('base64url')
}
export function decodeCursor(cursor: string): { sortValue: unknown; id: string } {
  return JSON.parse(Buffer.from(cursor, 'base64url').toString())
}
```

**Seed migration** `supabase/migrations/20260525000000_seed_places.sql`:
- Insert 30 real Vietnam landmarks (Hoan Kiem, Ha Long, Hoi An Old Town, My Son, Ben Thanh Market, Son Doong Cave, Sapa, Phong Nha Cave, Mekong Delta, etc.)
- Each row: `id`, `name` (Vietnamese), `name_en`, `province`, `lat`, `lng`, `category`, `credibility_score` (65–95), `sources_count` (3–5), `description`, `duration_hours`, `indoor`
- Also seed `place_source` rows (google_places + blog at minimum per place)
- Remove `VIETNAM_LANDMARKS` mock from `src/lib/mock-data.ts` (or leave for non-seeded envs)

Apply locally: `supabase db push` or `supabase migration up`

### Day 1–2: Plan Server Actions

**`src/schemas/plan.ts`** — Zod schemas:
```ts
export const CreatePlanSchema = z.object({
  title: z.string().min(5).max(120),
  title_vi: z.string().optional(),
  price: z.number().min(0),
  province: z.string(),
  provinces: z.array(z.string()).min(1),
  duration_days: z.number().int().min(1).max(30),
  difficulty: z.enum(['easy','moderate','challenging']),
  category: z.enum(['cultural','nature','food','adventure','beach','city']),
  highlights: z.array(z.string()).max(10),
  highlights_vi: z.array(z.string()).max(10),
  tags: z.array(z.string()).max(10),
  includes_transport: z.boolean().default(false),
  includes_tips: z.boolean().default(false),
  includes_media: z.boolean().default(false),
})
export const UpdatePlanStatusSchema = z.object({
  planId: z.string().uuid(),
  status: z.enum(['draft','published','archived']),
})
```

**`src/services/plan/createPlan.ts`**:
```ts
'use server'
export const createPlan = withServerAction(CreatePlanSchema, async (params, { userId }) => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('plan').insert({ ...params, creator_id: userId }).select().single()
  if (error) throw error
  updateTag(`usr_${userId}_pln`)  // Next.js 16: use updateTag in Server Actions for immediate invalidation
  return { data, code: AppSuccessCodes.CREATED, type: 'success' as const }
})
```

**`src/services/plan/getPlans.ts`** — split-function pattern:
```ts
// 1. Public entry (Server Action, NOT cached)
export const getPlans = withServerAction(GetPlansSchema, async ({ cursor, limit, search, category, sort }, { userId }) => {
  if (search?.trim()) return fetchPlans(userId, { cursor, limit, search, category, sort })
  return getPlansCache(userId, cursor, limit, category, sort)
})

// 2. Cached path (stable filters)
async function getPlansCache(...) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`_mkt`)
  return fetchPlans(...)
}

// 3. Shared query builder
async function fetchPlans(userId: string | null, opts: ...) {
  const supabase = await createAdminClient()
  let q = supabase.from('plan').select('*, profile!creator_id(id,name,avatar_url,verified,rating)')
    .eq('status','published')
  // apply category, sort, cursor pagination (limit+1, detect hasMore)
  // return CursorPlansResponse
}
```

**`src/services/plan/getPlanById.ts`** — fetch single plan with stops + creator:
```ts
// Used by plan detail modal + itinerary route
// Cache: 'use cache', cacheTag(`_mkt`), not user-scoped (public plan)
```

**`src/services/plan/updatePlanStatus.ts`** — already exists, verify it:
- On publish: `updateTag(\`usr_${userId}_pln\`)` (Server Action mutation), `revalidateTag('_mkt', 'max')` (global cache)
- Check `profile.total_plans` increments

**`src/services/plan/getMyPlans.ts`**:
```ts
// Fetches plans where creator_id = userId
// Cache: usr_${userId}_pln
// Returns CursorPlansResponse
```

### Day 2–3: Stop Server Actions

**`src/schemas/stop.ts`**:
```ts
export const AddStopSchema = z.object({
  planId: z.string().uuid(),
  placeId: z.string(),
  stopOrder: z.number().int().min(1),
  travelTimeMin: z.number().int().min(0),
  transportMode: z.enum(['walk','taxi','motorbike','bus']),
  notes: z.string().optional(),
})
export const UpdateStopSchema = AddStopSchema.extend({ stopId: z.string().uuid() }).omit({ planId: true })
export const DeleteStopSchema = z.object({ stopId: z.string().uuid(), planId: z.string().uuid() })
export const ReorderStopsSchema = z.object({ planId: z.string().uuid(), orderedStopIds: z.array(z.string().uuid()) })
```

**`src/services/stop/addStop.ts`**, **`updateStop.ts`**, **`deleteStop.ts`**, **`reorderStops.ts`**:
- All validate creator_id = userId before mutating
- All `updateTag(\`usr_${userId}_pln\`)` after mutation (Server Action pattern)

**`src/services/place/getPlaces.ts`**:
```ts
// Returns paginated places for stop picker
// Cache: _pls, cacheLife('hours') — places change rarely
// Filter by province optional
```

### Day 3–4: Purchase Server Action + Review

**`src/services/plan/purchasePlan.ts`** — already exists, verify:
- Check: `revalidateTag` uses correct signatures (no extra args beyond tag name)
- Fix `revalidateTag(\`usr_${userId}_pln\`, 'minutes')` → `updateTag(\`usr_${userId}_pln\`)` (Next.js 16: `updateTag` in Server Actions for mutation-driven invalidation; old 2-arg `revalidateTag` form is deprecated)

**`src/services/review/submitReview.ts`** — verify exists + calls `recalculate_plan_rating` RPC.

**`src/schemas/review.ts`**:
```ts
export const SubmitReviewSchema = z.object({
  planId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  comment_vi: z.string().max(500).optional(),
})
```

### Day 4–5: Actor types + type generation

**`src/types/actors/plan.ts`**:
```ts
export type PlanWithCreator = Tables<'plan'> & {
  profile: Pick<Tables<'profile'>, 'id' | 'name' | 'avatar_url' | 'verified' | 'rating'>
}
export type PlanWithStops = PlanWithCreator & { stop: Tables<'stop'>[] }
export type CursorPlansResponse = { items: PlanWithCreator[]; total: number; nextCursor: string | null; hasMore: boolean }
```

**`src/types/actors/creator.ts`**, **`src/types/actors/place.ts`** — similar shape.

Run `pnpm gen:types` after any new migration applied.

---

## Dev B — Frontend: Marketplace, Creator Studio, My-Plans (Real Data)

### Day 1: UserContext → real auth

**`src/components/ui/UserContext.tsx`** — replace mock wallet with real:
```tsx
'use client'
// useUser() hook:
// - ownedPlanIds: Set<string> — fetched from purchased_plan table on mount
// - profile: Profile | null — from supabase.auth.getUser() + profile table
// - walletBalance: removed (no wallet, payment via SePay direct)
// - purchasePlan(planId): calls purchasePlan Server Action
```
Remove wallet/topUpWallet entirely — SePay handles payment Sprint 5. For now, purchasePlan is free (no payment gate) to unblock testing.

### Day 2–3: Marketplace.tsx — real data

**`src/components/sections/marketplace/MarketplaceWrapper.tsx`** (Server Component):
```tsx
// Fetches initial page of plans server-side
// Passes to MarketplaceClient as seedPlans
export default async function MarketplaceWrapper() {
  const response = await getPlans({ limit: 12 })
  return <MarketplaceClient seedPlans={response.data.items} ... />
}
```

**`src/components/sections/marketplace/MarketplaceClient.tsx`** (replace `Marketplace.tsx`):
- Remove all `MOCK_PLANS`, `MOCK_REVIEWS` imports
- Use Mantine `TextInput` (search), `Chip.Group` (category filter), `Select` (sort)
- Use Mantine `SimpleGrid` for plan card grid
- Infinite scroll: `useInfiniteScroll` hook (see below) calling `getPlans` Server Action
- `PlanCard` → Mantine `Card` component

**`src/hooks/useInfiniteScroll.ts`**:
```ts
export function useInfiniteScroll<T>(
  seedItems: T[],
  fetchMore: (cursor: string) => Promise<{ items: T[]; nextCursor: string | null; hasMore: boolean }>,
) {
  // IntersectionObserver on sentinel div
  // Dedupe by id using Map
  // Returns: { items, loadMore, hasMore, isLoading }
}
```

**`src/components/sections/marketplace/PlanDetailModal.tsx`** — Mantine `Modal`:
- Fetch full plan + reviews via `getPlanById` on open
- Mantine `ScrollArea`, `Badge`, `Rating`, `Divider`
- "Open in Planner" → `router.push` with `startNavigationProgress()`
- Buy button → calls `purchasePlan` Server Action (no SePay yet — Sprint 5)

**`src/components/sections/marketplace/AiServiceModal.tsx`** — Mantine `Modal`:
- Keep AI tier selection UI (per-plan / monthly) — wire to SePay Sprint 5
- For now: selecting tier and confirming → calls `purchasePlan` directly

### Day 3–4: Creator Studio — real data

**Route pattern** for Create:
```
src/app/(dashboard)/dashboard/create/
├── page.tsx           ← Server Component, suspense wrapper
├── CreatePageShell.tsx ← Client Component
└── loading.tsx
src/components/sections/create/
├── CreatorStudioWrapper.tsx  ← Server Component, fetches myPlans
└── CreatorStudio.tsx         ← Client Component (state + interactivity)
```

**`CreatorStudioWrapper.tsx`**:
```tsx
const { data } = await getMyPlans({ limit: 20 })
return <CreatorStudio seedPlans={data.items} />
```

**`CreatorStudio.tsx`** — replace MOCK_PLANS with `seedPlans` prop:
- `handlePublish` → calls `createPlan` then `updatePlanStatus({ status: 'published' })`
- `handleSaveDraft` → calls `createPlan` (no status change, stays 'draft')
- `handleEditPlan` → calls `updatePlan` Server Action
- Stop picker → fetches from `getPlaces` Server Action (real place data)
- Earnings card → computed from real `plan.purchase_count * plan.price`
- AI Polish panel → still simulated (real AI tools Sprint 3)
- Analytics panel → keep mock chart, wire to real data Sprint 6

### Day 4–5: My-Plans page (PPR pattern)

```
src/app/(dashboard)/dashboard/my-plans/
├── page.tsx                    ← Server Component
├── MyPlansPageShell.tsx        ← Client Component  
└── loading.tsx                 ← Skeleton
src/components/sections/my-plans/
├── MyPlansWrapper.tsx          ← Server Component, fetches purchased_plan
├── MyPlansList.tsx             ← Client Component
└── PlanCard.tsx                ← reusable plan card (owned context)
```

**`MyPlansWrapper.tsx`**:
```tsx
// Fetch purchased_plan JOIN plan JOIN stop for current user
// Cache: usr_${userId}_pln, cacheLife('minutes')
```

**`MyPlansList.tsx`**:
- List of owned plans with "Start Trip" button (disabled until Sprint 4)
- "Open in Planner" → `/dashboard/itinerary/[purchasedPlanId]`
- Mantine `Card`, `Badge`, `Group`, `Text`
- Skeleton while loading more

**`src/services/purchasedPlan/getMyPurchasedPlans.ts`**:
```ts
// Cursor-paginated, usr_${userId}_pln tag
// Returns: purchased_plan + plan fields + stop count
```

---

## Sprint 2 Definition of Done

- [ ] Marketplace shows real plans from DB (not mock data)
- [ ] Plans seeded: at least 5 published plans with stops linked to real places
- [ ] Creator can create plan (draft), add stops from real place table, publish
- [ ] Published plan appears in marketplace
- [ ] Consumer can purchase plan (no payment gate yet) — `purchased_plan` row created, stops seeded
- [ ] My-Plans page shows owned plans with correct data
- [ ] `review` submitted via `submitReview` — `plan.rating` recalculates correctly
- [ ] No `MOCK_PLANS`, `MOCK_CREATORS`, `MOCK_REVIEWS` in marketplace or creator routes
- [ ] Cursor pagination works (scroll loads next page)
- [ ] `pnpm build` passes

## Stretch Goals

- `FrequencyDashboard` wired to real `province_stats` view
- Creator analytics: real `purchase_count` / `review_count` per plan
- Cover image upload via Supabase Storage
