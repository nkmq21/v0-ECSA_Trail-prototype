# Sprint 5 — SePay · AI Subscription · Gamification · Place Ingest

**Week:** 5  
**Goal:** Users can pay for AI tier upgrades via SePay. Gamification loop is live (earn EXP at stops, level up, see badge). Place ingest pipeline runs via Edge Function.  
**Prerequisite:** Sprint 4 complete — trips work, weather alerts fire.

---

## Dev A — SePay · AI Subscription · Place Ingest · Gamification Backend

### Day 1: SePay research + sandbox setup

**SePay integration overview:**
SePay is a Vietnamese payment aggregator supporting bank QR transfer, Momo, ZaloPay, VNPay. Integration pattern:
1. Your backend creates a payment order → SePay returns a QR code / payment URL
2. User completes payment on SePay-hosted page or via QR
3. SePay fires webhook to your endpoint when payment confirmed

**SePay API endpoints (confirm from docs.sepay.vn):**
- `POST /api/v1/payment/create` — create order, returns `qr_code`, `payment_url`, `order_id`
- Webhook: `POST /api/payment/webhook` — `{ order_id, status, amount, transaction_id }`

**Setup:**
- Create SePay sandbox account at `sandbox.sepay.vn`
- Obtain `SEPAY_API_KEY` + `SEPAY_WEBHOOK_SECRET`
- Add both to `.env.local`

**`src/lib/sepay.ts`**:
```ts
const BASE = process.env.SEPAY_SANDBOX === '1'
  ? 'https://sandbox.sepay.vn/api/v1'
  : 'https://api.sepay.vn/api/v1'

export interface SepayOrder {
  orderId: string
  amount: number            // VND
  description: string
  returnUrl: string
  cancelUrl: string
}

export interface SepayOrderResult {
  qrCode: string            // base64 QR image or URL
  paymentUrl: string
  expiresAt: string
}

export async function createPaymentOrder(order: SepayOrder): Promise<SepayOrderResult> {
  const res = await fetch(`${BASE}/payment/create`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.SEPAY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: order.orderId,
      amount: order.amount,
      description: order.description,
      return_url: order.returnUrl,
      cancel_url: order.cancelUrl,
    }),
  })
  const data = await res.json()
  return { qrCode: data.qr_code, paymentUrl: data.payment_url, expiresAt: data.expires_at }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expected = createHmac('sha256', process.env.SEPAY_WEBHOOK_SECRET!).update(body).digest('hex')
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
```

**Currency note:** SePay uses VND. Subscription prices in DB are USD-equivalent. Use fixed exchange rate constant `USD_TO_VND = 25000` in `src/lib/sepay.ts` — expose as config, not hardcoded everywhere.

### Day 2: SePay Server Actions + Webhook

**`src/schemas/subscription.ts`**:
```ts
export const InitiateSubscriptionSchema = z.object({
  tier: z.enum(['per-plan', 'monthly']),
  planId: z.string().uuid().optional(),  // required for per-plan tier
})
```

**`src/services/subscription/initiateSubscription.ts`**:
```ts
// 1. Calculate amount (USD → VND)
// 2. Generate unique orderId (uuid)
// 3. Call createPaymentOrder(sepay) → { qrCode, paymentUrl }
// 4. Insert ai_subscription row with status='pending', payment_service_subscription_id=orderId
// 5. Return { qrCode, paymentUrl, orderId }
```

**`src/app/api/payment/webhook/route.ts`** — SePay webhook handler:
```ts
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-sepay-signature') ?? ''
  if (!verifyWebhookSignature(body, signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const event = JSON.parse(body)
  const supabase = createAdminClient()  // bypass RLS — webhook is server-only

  if (event.status === 'SUCCESS') {
    // 1. Find ai_subscription by payment_service_subscription_id = event.order_id
    // 2. Update status='active', current_period_end = now + 30 days (monthly) or null (per-plan)
    // 3. If per-plan: update purchased_plan.ai_tier for the planId stored in description
    // 4. revalidateTag on the user's subscription cache
  }

  return NextResponse.json({ received: true })
}
```

**`src/services/subscription/getSubscriptionStatus.ts`**:
```ts
// 'use cache', cacheTag(`usr_${userId}_aip`), cacheLife('minutes')
// Returns: { hasActiveMonthly: boolean, perPlanTierByPlanId: Record<string, AiTier> }
```

### Day 2–3: Gamification Server Actions

**`src/schemas/gamification.ts`**:
```ts
export const CompleteChallengeSchema = z.object({
  challengeInstanceId: z.string().uuid(),
})
export const RedeemVoucherSchema = z.object({
  voucherId: z.string().uuid(),
})
export const CancelRedemptionSchema = z.object({
  redemptionId: z.string().uuid(),
})
```

**`src/services/gamification/completeChallenge.ts`**:
```ts
// 1. Fetch challenge_instance — verify owned by userId, status='pending'
// 2. Update challenge_instance: status='completed', completed_at=now()
// 3. Insert reward_ledger row (exp_delta, points_delta, reason='challenge_completed')
//    → DB trigger apply_reward_ledger handles user_progress update + badge recalc
// 4. revalidateTag(`usr_${userId}_pln`)
// Return: { newLevel, newBadge, expEarned, pointsEarned }
```

**`src/services/gamification/redeemVoucher.ts`**:
```ts
// 1. Lock voucher row (for update) — check stock > 0, status='active', valid window
// 2. Check user_progress.points_balance >= voucher.points_cost
// 3. In transaction (RPC):
//    a. INSERT voucher_redemption (status='reserved', points_spent=voucher.points_cost)
//    b. INSERT reward_ledger (exp_delta=0, points_delta=-voucher.points_cost, reason='voucher_redemption')
//       → trigger decrements points_balance
//    c. UPDATE voucher SET stock = stock - 1
// 4. Return: { redemptionId, newPointsBalance, qrCode: null }  -- QR for Sprint 6
```

**`src/services/gamification/cancelRedemption.ts`**:
```ts
// 1. Update voucher_redemption status='cancelled'
// 2. INSERT reward_ledger (points_delta=+points_spent, reason='voucher_redemption_cancelled')
//    → trigger refunds points
// 3. UPDATE voucher SET stock = stock + 1
```

**`src/services/gamification/seedChallengesForPurchase.ts`**:
```ts
// Called by purchasePlan Server Action (add call there)
// Join stop_challenge (plan stops) → purchased stops (match by stop_order)
// INSERT challenge_instance rows for each active stop_challenge
```

**`src/services/gamification/getUserProgress.ts`**:
```ts
// Fetch user_progress JOIN badge_tier for current user
// Cache: usr_${userId}_pln (reuse — progress tied to plan activity)
```

**New migration** `supabase/migrations/20260526000000_seed_badge_tiers.sql`:
```sql
INSERT INTO public.badge_tier (name, rank, min_exp, icon_url) VALUES
  ('Noob Explorer',  0,    0, '/badges/noob.svg'),
  ('Trail Walker',   1,  200, '/badges/walker.svg'),
  ('Path Finder',    2,  500, '/badges/pathfinder.svg'),
  ('Trail Blazer',   3, 1000, '/badges/blazer.svg'),
  ('Summit Pro',     4, 2000, '/badges/pro.svg'),
  ('Legend',         5, 5000, '/badges/legend.svg');
```

### Day 3–4: place-ingest Edge Function

**`supabase/functions/place-ingest/index.ts`** (Deno):
```ts
// HTTP trigger (called manually or via cron weekly)
// Body: { province: string, category?: string }
// 1. Call Google Places API (Nearby Search / Text Search)
// 2. For each result:
//    a. Check if place.id exists already
//    b. If new: INSERT place_source (source_type='google_places')
//       Cross-reference with scrape source (blog / tripadvisor stub)
//       Count sources → if sources_count >= 3: place becomes source_verified
//    c. If existing: UPDATE credibility_score, add new place_source if not duplicate
// 3. Return { inserted, updated, skipped }
```

**`supabase/functions/place-ingest/credibility.ts`**:
```ts
export function scoreCredibility(sources: PlaceSource[]): number {
  // Base 40 for Google Places
  // +20 for each additional source type (Facebook, blog, TripAdvisor)
  // Cap at 95 (reserve 96-100 for manually curated)
  let score = 0
  if (sources.some(s => s.source_type === 'google_places')) score += 40
  if (sources.some(s => s.source_type === 'facebook'))      score += 20
  if (sources.some(s => s.source_type === 'blog'))          score += 20
  if (sources.some(s => s.source_type === 'tripadvisor'))   score += 15
  return Math.min(score, 95)
}
```

**Deploy:** `pnpm run ef place-ingest`

### Day 4–5: Calc RPCs + rating fix

**Migration** `supabase/migrations/20260527000000_calc_rpcs.sql`:
```sql
-- Already added recalculate_plan_rating in migration 3. Add missing ones:

CREATE OR REPLACE FUNCTION public.increment_total_plans(p_creator_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE profile SET total_plans = total_plans + 1 WHERE id = p_creator_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_total_plans(p_creator_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE profile SET total_plans = greatest(total_plans - 1, 0) WHERE id = p_creator_id;
$$;
```

Run `pnpm gen:types` after migration.

---

## Dev B — Subscription UI · Gamification UI · Voucher Store

### Day 1–2: AI Subscription page

```
src/app/(dashboard)/dashboard/subscription/
├── page.tsx
├── SubscriptionPageShell.tsx
└── loading.tsx
src/components/sections/subscription/
├── SubscriptionWrapper.tsx   ← Server Component, fetches subscription status
└── SubscriptionClient.tsx    ← Client Component
```

**`SubscriptionClient.tsx`**:
- Shows current tier: Free / Per-Plan / Monthly
- Tier cards (Mantine `Card` with highlighted border for recommended)
- Monthly tier: `$4.99/month` → "Upgrade" button
- Per-plan tier: `$0.99/plan` → shown in AiServiceModal at purchase time
- On "Upgrade": calls `initiateSubscription` → shows `SepayPaymentModal`

**`src/components/sections/subscription/SepayPaymentModal.tsx`**:
```tsx
// Mantine Modal
// Shows: QR code image (<img src={qrCode} />), amount in VND, timer (10 min expiry)
// Polling: every 5s call GET /api/payment/status?orderId=... to check if payment confirmed
// On confirmed: close modal, show Mantine success notification, update subscription badge in NavBar
// On timeout: show "Payment expired, try again"
// Note: use useInterval from @mantine/hooks for polling
```

**NavBar AI badge** — show "Premium" chip when `hasActiveMonthly = true`.

**AiServiceModal** (in Marketplace) — update buy flow:
- No longer free after Sprint 2 simplification
- On tier selection: calls `initiateSubscription`, opens `SepayPaymentModal`
- Only proceeds to `purchasePlan` after payment confirmed

### Day 2–3: User progress widget

**`src/components/sections/gamification/UserProgressCard.tsx`**:
```tsx
// Shows in My-Plans page sidebar / dashboard header
// - Avatar + display name
// - Badge tier icon + name (e.g. "Trail Walker")
// - EXP progress bar: exp_total / next_tier.min_exp (Mantine Progress)
// - Level number
// - Points balance (coin icon)
// - "Redeem Points" button → opens VoucherStoreModal
```

**`src/components/sections/gamification/LevelUpToast.tsx`**:
```tsx
// Called after completeChallenge returns newLevel > previousLevel
// Framer Motion scale-up animation overlay (brief, auto-dismiss)
// Shows: "Level Up! You're now Level 5 — Trail Blazer 🏆"
```

### Day 3–4: Trip challenges UI

**`src/components/sections/itinerary/StopChallengeList.tsx`**:
```tsx
// Shown in StopCard expansion area (expandable section below stop details)
// Lists challenge_instance rows for this purchased stop
// Each challenge shows: title, description, EXP/points reward, status badge
// "Complete" button (only when trip is active) → calls completeChallenge Server Action
// On complete: updates UI optimistically (status='completed', grey out button)
//             shows +EXP / +Points floating toast
```

**`src/components/sections/create/StopChallengeBuilder.tsx`**:
```tsx
// Used in Creator Studio's stop edit panel
// Creator can add up to 3 challenges per plan stop
// Fields: title, description, exp_reward (50/100/200), points_reward (10/25/50)
// Calls createStopChallenge / deleteStopChallenge Server Actions
// Validates: stop must be a plan stop (plan_id set), not purchased/alert stop
```

**`src/services/gamification/createStopChallenge.ts`**, **`deleteStopChallenge.ts`** — CRUD for `stop_challenge`.

### Day 4–5: Voucher store

**`src/components/sections/gamification/VoucherStoreModal.tsx`**:
```tsx
// Mantine Modal (large), triggered from UserProgressCard
// Grid of available vouchers (status='active', stock>0, valid_to >= now)
// Each VoucherCard shows: place name, title, description, points_cost, stock remaining
// "Redeem" button (disabled if insufficient points)
// Confirm step: "This will spend X points. Confirm?" (inline Mantine Confirm UI, NOT modals API)
// On redeem: calls redeemVoucher → shows redemption code / QR stub
// My Redemptions tab: lists user's voucher_redemption rows with status
// "Cancel" button for status='reserved' redemptions
```

**`src/services/gamification/getVouchers.ts`**:
```ts
// Public read — no auth required
// Filter: status='active', stock>0, valid_to IS NULL OR valid_to > now()
// Cache: global tag 'vouchers', cacheLife('hours')
```

**`src/services/gamification/getMyRedemptions.ts`**:
```ts
// Own rows only: voucher_redemption JOIN voucher JOIN place
// Cache: usr_${userId}_pln (reuse — small data)
```

---

## Sprint 5 Definition of Done

- [ ] SePay sandbox payment flow end-to-end: initiate → QR displayed → manual webhook trigger → subscription activates
- [ ] `ai_subscription` row created with `status='active'` after successful payment
- [ ] Gemini uses premium model (`gemini-2.5-pro`) when subscription active
- [ ] Gamification: completing a challenge → `reward_ledger` row → `user_progress.exp_total` increments → badge recalculates
- [ ] Level-up toast fires when EXP crosses tier threshold
- [ ] Voucher redeemed: `points_balance` decreases, `voucher.stock` decreases, `reward_ledger` row inserted
- [ ] Creator can add stop challenges in Creator Studio
- [ ] Subscription page shows current tier correctly
- [ ] `place-ingest` Edge Function deploys and runs without error (test with one province)
- [ ] `pnpm build` passes

## Stretch Goals

- SePay payment polling replaced by Supabase Realtime subscription on `ai_subscription` table
- Voucher QR code displayed (generate QR from `redemption.id` using `qrcode` package)
- Leaderboard: top 10 users by `exp_total` (public view, anonymous option)
- Creator can seed badge_tier data via admin route (avoid raw SQL)
