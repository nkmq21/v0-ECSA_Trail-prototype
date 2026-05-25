# DB Trigger → Backend Code Split

## Principle
DB owns data integrity invariants. Backend owns business rules that will evolve, need testing, or trigger side effects beyond the DB (cache tags, notifications, Stripe, analytics).

---

## Decision Table

| Function | Trigger event | Decision | Reason |
|---|---|---|---|
| `set_updated_at` | BEFORE UPDATE on 5 tables | **KEEP in DB** | Pure timestamp consistency — must fire even on direct SQL/admin access. No business logic. |
| `handle_new_user` | AFTER INSERT on `auth.users` | **KEEP in DB** | Fires on Supabase internal Auth event — only reliable hook point. Standard Supabase pattern. |
| `seed_purchased_plan_stops` | AFTER INSERT on `purchased_plan` | **MOVE to backend** | Stop schema evolves; trigger silently misses new columns. "What does purchasing provision?" is business logic. |
| `handle_plan_purchase` | AFTER INSERT on `purchased_plan` | **MOVE to backend** | Purchase flow will expand: Stripe, AI tier provisioning, cache invalidation, analytics. Combine with above in one atomic Server Action. |
| `handle_new_review` | AFTER INSERT on `review` | **MOVE to backend** | Rating formula is a business rule (could add verified-purchase weighting, fraud flags). Incremental formula drifts under concurrent writes — `AVG()` aggregate is correct. |
| `handle_plan_status_change` | AFTER UPDATE OF status on `plan` | **MOVE to backend** | Auto-purchase own plan = creator entitlement rule. Publish flow will expand: RAG place verification, CDN warm, follower notifications. |

---

## Migration: `supabase/migrations/20260524000000_drop_business_logic_triggers.sql`

```sql
-- Drop triggers for business-logic functions (keep set_updated_at + handle_new_user)
drop trigger if exists on_plan_purchased        on public.purchased_plan;
drop trigger if exists on_purchased_plan_insert on public.purchased_plan;
drop trigger if exists on_review_insert         on public.review;
drop trigger if exists on_plan_status_update    on public.plan;

-- Drop the functions
drop function if exists public.seed_purchased_plan_stops();
drop function if exists public.handle_plan_purchase();
drop function if exists public.handle_new_review();
drop function if exists public.handle_plan_status_change();

-- Add atomic purchase RPC (explicitly called by Server Action — NOT a trigger)
create or replace function public.purchase_plan_atomic(
    p_user_id uuid,
    p_plan_id uuid,
    p_ai_tier  ai_tier default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
    v_purchased_id uuid;
    v_creator_id   uuid;
begin
    insert into purchased_plan (user_id, plan_id, ai_tier)
    values (p_user_id, p_plan_id, p_ai_tier)
    returning id into v_purchased_id;

    insert into stop (purchased_plan_id, place_id, stop_order, travel_time_min, transport_mode, notes)
    select v_purchased_id, s.place_id, s.stop_order, s.travel_time_min, s.transport_mode, s.notes
    from stop s
    where s.plan_id = p_plan_id;

    update plan
    set purchase_count = purchase_count + 1
    where id = p_plan_id
    returning creator_id into v_creator_id;

    update profile
    set total_sales = total_sales + 1
    where id = v_creator_id;

    return v_purchased_id;
end;
$$;
```

`purchase_plan_atomic` is an **RPC called explicitly by backend** — not a trigger. Only runs when the Server Action calls it, not on every raw insert.

---

## New Server Actions

### `src/services/plan/purchasePlan.ts`
Replaces `seed_purchased_plan_stops` + `handle_plan_purchase`.

```
withServerAction(PurchasePlanSchema, async ({ planId, aiTier }, { userId }) => {
  const supabase = await createClient()

  // Single atomic DB call — 4 writes in one transaction
  const { data, error } = await supabase
    .rpc('purchase_plan_atomic', { p_user_id: userId, p_plan_id: planId, p_ai_tier: aiTier ?? null })
  if (error) throw error

  // Cache side-effects (safe to run after commit)
  revalidateTag(`usr_${userId}_pln`)
  revalidateTag('_mkt')

  return { data, code: AppSuccessCodes.CREATED, type: 'success' }
})
```

### `src/services/review/submitReview.ts`
Replaces `handle_new_review`.

```
withServerAction(SubmitReviewSchema, async ({ planId, rating, comment }, { userId }) => {
  const supabase = await createClient()

  const { error: insertErr } = await supabase
    .from('review').insert({ user_id: userId, plan_id: planId, rating, comment })
  if (insertErr) throw insertErr

  // Recompute aggregates with correct AVG (avoids incremental drift under concurrency)
  const { data: plan } = await supabase
    .from('plan').select('creator_id').eq('id', planId).single()

  await supabase.from('plan').update({
    rating:       supabase.rpc('calc_plan_rating', { p_plan_id: planId }),   // SELECT ROUND(AVG(rating)::numeric,2)
    review_count: supabase.rpc('calc_plan_review_count', { p_plan_id: planId }),
  }).eq('id', planId)

  await supabase.from('profile').update({
    rating:       supabase.rpc('calc_creator_rating', { p_creator_id: plan.creator_id }),
    review_count: supabase.rpc('calc_creator_review_count', { p_creator_id: plan.creator_id }),
  }).eq('id', plan.creator_id)

  revalidateTag(`_rvw_pln_${planId}`)
  revalidateTag('_mkt')

  return { data: null, code: AppSuccessCodes.CREATED, type: 'success' }
})
```

Note: the `calc_*` RPCs are tiny read-only SQL helpers — pure `SELECT AVG / COUNT` — not triggers. Keeps rating logic in one place, unit-testable.

### `src/services/plan/updatePlanStatus.ts`
Replaces `handle_plan_status_change`.

```
withServerAction(UpdatePlanStatusSchema, async ({ planId, status }, { userId }) => {
  const supabase = await createClient()

  const { data: old } = await supabase.from('plan').select('status').eq('id', planId).single()

  const { error } = await supabase.from('plan').update({ status }).eq('id', planId)
  if (error) throw error

  if (status === 'published' && old.status !== 'published') {
    await supabase.from('profile')
      .update({ total_plans: supabase.rpc('increment') })   // or raw SQL via RPC
      .eq('id', userId)

    // Creator auto-owns their plan (entitlement)
    await supabase.from('purchased_plan')
      .upsert({ user_id: userId, plan_id: planId }, { onConflict: 'user_id,plan_id', ignoreDuplicates: true })

    // Future: trigger RAG place verification, push to followers
  } else if (old.status === 'published' && status !== 'published') {
    await supabase.rpc('decrement_total_plans', { p_creator_id: userId })
  }

  revalidateTag(`usr_${userId}_pln`)
  revalidateTag('_mkt')

  return { data: null, code: AppSuccessCodes.UPDATED, type: 'success' }
})
```

---

## Files Summary

| File | Action |
|---|---|
| `supabase/migrations/20260524000000_drop_business_logic_triggers.sql` | New — drops 4 triggers/functions, adds `purchase_plan_atomic` RPC |
| `src/services/plan/purchasePlan.ts` | New Server Action |
| `src/services/review/submitReview.ts` | New Server Action |
| `src/services/plan/updatePlanStatus.ts` | New Server Action |
| `src/types/database.types.ts` | Regenerate: `npm run gen:types` after migration applied |

---

## After Migration Checklist
1. `npm run gen:types` — regenerate DB types
2. `npx tsc --noEmit` — verify no new type errors
3. Integration test `purchase_plan_atomic`: force stop insert failure → verify full rollback
4. Submit review → verify `plan.rating` = `SELECT AVG(rating) FROM review WHERE plan_id = X`
5. Publish plan → verify `profile.total_plans++` and `purchased_plan` row exists for creator
