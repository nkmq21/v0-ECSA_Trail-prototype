# Gamification Schema Enhancement Plan

## Problem & goals
Enhance the existing Supabase schema to support stop-based challenges that award EXP and redeemable points, global user progression (level + badge tiers), and voucher redemption tied to places/restaurants.

## Current schema context
- `stop` is the unified table for plan stops and purchased-plan stops; `trip` points to `purchased_plan`.
- Creator-published plans live in `plan`, with `purchased_plan` representing ownership.
- There is no current progress/achievement or voucher system.

## Proposed schema changes (high level)
### New enums
- `challenge_status`: `pending | completed | failed`
- `voucher_status`: `active | paused | expired`
- `redemption_status`: `reserved | redeemed | cancelled`

### New tables
1. **badge_tier**
   - `id uuid pk`, `name text`, `rank int2`, `min_exp int4`, `icon_url text`, `created_at`
   - Configurable thresholds for `noob -> pro -> expert`

2. **user_progress**
   - `user_id uuid pk` → `profile(id)`
   - `exp_total int4`, `level int2`, `badge_tier_id uuid`, `points_balance int4`, `updated_at`
   - Global, cross-trip progression

3. **stop_challenge**
   - `id uuid pk`, `plan_stop_id uuid` → `stop(id)` (plan context only)
   - `title text`, `description text`, `exp_reward int4`, `points_reward int4`, `challenge_order int2`
   - `active boolean`, `created_at`
   - Curated per stop by the plan creator (per user decision)

4. **challenge_instance**
   - `id uuid pk`
   - `user_id uuid` → `profile(id)`
   - `trip_id uuid` → `trip(id)`
   - `purchased_stop_id uuid` → `stop(id)` (purchased_plan context)
   - `template_id uuid` → `stop_challenge(id)`
   - `status challenge_status`, `completed_at timestamptz`
   - Snapshot `exp_reward`, `points_reward` for audit consistency

5. **reward_ledger**
   - `id uuid pk`, `user_id uuid`
   - `challenge_instance_id uuid` (nullable for manual adjustments)
   - `exp_delta int4`, `points_delta int4`, `reason text`, `created_at`
   - Auditable history for EXP/points

6. **voucher**
   - `id uuid pk`
   - `place_id text` → `place(id)` (restaurant/stop)
   - `title text`, `description text`
   - `points_cost int4`, `stock int4`, `status voucher_status`
   - `valid_from/valid_to timestamptz`, `created_at`

7. **voucher_redemption**
   - `id uuid pk`
   - `user_id uuid` → `profile(id)`
   - `voucher_id uuid` → `voucher(id)`
   - `points_spent int4`, `status redemption_status`, `redeemed_at timestamptz`

### Key flows & triggers
- **Seed challenges**: on `purchased_plan` insert, create `challenge_instance` rows by joining `stop_challenge` (plan stops) to the newly seeded purchased-plan stops (match by `stop_order`).
- **Completion rewards**: when a `challenge_instance` transitions to `completed`, insert a `reward_ledger` row and update `user_progress` (EXP/points).
- **Badge recalculation**: on EXP update, set `badge_tier_id` to the highest `badge_tier.min_exp <= exp_total`.
- **Voucher redemption**: on `voucher_redemption` insert, deduct `points_balance` and decrement `voucher.stock` (guarded by check/constraint).

### DB vs backend responsibility split (proposed)
**Keep in DB (invariants + consistency):**
- `ensure_user_progress` trigger on `profile` insert (create the progress row).
- `validate_stop_challenge_plan_stop` trigger to guarantee challenges only target plan stops.
- `apply_reward_ledger` trigger + `calculate_level()` to keep `user_progress` in sync and recalc badge tier.
- `set_updated_at` on `user_progress` (reuse existing helper).

**Move to backend (workflow-heavy logic):**
- `seed_challenge_instances`, `backfill_challenge_instances`, `attach_trip_challenges` (trip/stop orchestration).
- `set_challenge_completed_at` + `handle_challenge_completion` (status transition + ledger insert).
- `handle_voucher_redemption` + `handle_voucher_cancellation` (voucher flow, stock & ledger updates in a single backend transaction).

### RLS policies
- `stop_challenge`: readable when its parent plan is visible; writable only by plan creator.
- `challenge_instance`, `reward_ledger`, `user_progress`, `voucher_redemption`: only the owning user can read/write.
- `voucher`: public read; writes restricted to service role or privileged creator/admin path (decide with policy).

### Indexes
- `challenge_instance (user_id, status)`, `(trip_id)`, `(purchased_stop_id)`
- `stop_challenge (plan_stop_id, active)`
- `reward_ledger (user_id, created_at)`
- `voucher (place_id, status)`, `voucher_redemption (user_id, redeemed_at)`

## Migration strategy
- Add a new migration file (e.g., `20260523000000_gamification_schema.sql`) with enums, tables, indexes, and RLS policies.
- Keep DB triggers limited to invariants; move orchestration workflows to backend code.
- Keep the original initial schema migration unchanged.

## Documentation deliverable
- Create `.github/plans/gamification-schema-plan.md` summarizing the schema additions and rationale.

## Todos
- Draft migration SQL for gamification enums/tables with constraints.
- Keep only invariant triggers in DB; refactor workflow triggers into backend code.
- Add indexes for query performance.
- Write `.github/plans/gamification-schema-plan.md` with the schema plan.
