-- Drop business-logic triggers — replaced by Server Actions in services/
-- Keep: set_updated_at (pure timestamp), handle_new_user (auth bootstrap)

drop trigger if exists on_plan_purchased        on public.purchased_plan;
drop trigger if exists on_purchased_plan_insert on public.purchased_plan;
drop trigger if exists on_review_insert         on public.review;
drop trigger if exists on_plan_status_update    on public.plan;

drop function if exists public.seed_purchased_plan_stops();
drop function if exists public.handle_plan_purchase();
drop function if exists public.handle_new_review();
drop function if exists public.handle_plan_status_change();

-- ── Atomic purchase RPC ───────────────────────────────────────────────────────
-- Called explicitly by purchasePlan Server Action — NOT a trigger.
-- Runs the 4 writes (purchased_plan insert, stop seeding, plan/profile counters)
-- in a single transaction, returning the new purchased_plan.id.

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

    -- Seed user's copy of stops from the plan's original stops
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

-- ── Rating recalculation RPC ──────────────────────────────────────────────────
-- Called by submitReview Server Action after inserting a review.
-- Uses AVG aggregate instead of incremental formula to avoid concurrency drift.

create or replace function public.recalculate_plan_rating(p_plan_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
    v_creator_id uuid;
begin
    update plan set
        rating       = coalesce((select round(avg(r.rating)::numeric, 2) from review r where r.plan_id = p_plan_id), 0),
        review_count = (select count(*) from review r where r.plan_id = p_plan_id)
    where id = p_plan_id
    returning creator_id into v_creator_id;

    update profile set
        rating = coalesce((
            select avg(p.rating)
            from plan p
            where p.creator_id = v_creator_id and p.review_count > 0
        ), 0),
        review_count = (
            select count(*)
            from review r
            join plan p on p.id = r.plan_id
            where p.creator_id = v_creator_id
        )
    where id = v_creator_id;
end;
$$;
