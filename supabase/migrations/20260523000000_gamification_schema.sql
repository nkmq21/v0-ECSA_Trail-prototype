-- ECSATrail — Gamification Schema
-- Stop-based challenges, EXP/points, badge tiers, vouchers

-- ── Enums ─────────────────────────────────────────────────────────────────────

create type challenge_status as enum ('pending','completed','failed');
create type voucher_status as enum ('active','paused','expired');
create type redemption_status as enum ('reserved','redeemed','cancelled');

-- ── Tables ────────────────────────────────────────────────────────────────────

-- badge_tier: configurable EXP thresholds (noob -> pro -> expert)
create table public.badge_tier (
    id         uuid        primary key default gen_random_uuid(),
    name       text        not null,
    rank       int2        not null check (rank >= 0),
    min_exp    int4        not null check (min_exp >= 0),
    icon_url   text,
    created_at timestamptz not null default now(),
    unique (name),
    unique (rank)
);

-- user_progress: global progression per user
create table public.user_progress (
    user_id        uuid        primary key references public.profile(id) on delete cascade,
    exp_total      int4        not null default 0 check (exp_total >= 0),
    level          int2        not null default 1 check (level > 0),
    badge_tier_id  uuid        references public.badge_tier(id) on delete set null,
    points_balance int4        not null default 0 check (points_balance >= 0),
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- stop_challenge: curated missions per plan stop
create table public.stop_challenge (
    id              uuid        primary key default gen_random_uuid(),
    plan_stop_id    uuid        not null references public.stop(id) on delete cascade,
    title           text        not null,
    description     text,
    exp_reward      int4        not null default 0 check (exp_reward >= 0),
    points_reward   int4        not null default 0 check (points_reward >= 0),
    challenge_order int2        not null default 1,
    active          boolean     not null default true,
    created_at      timestamptz not null default now(),
    unique (plan_stop_id, challenge_order)
);

-- challenge_instance: per-user instances seeded from stop_challenge
create table public.challenge_instance (
    id               uuid             primary key default gen_random_uuid(),
    user_id          uuid             not null references public.profile(id) on delete cascade,
    trip_id          uuid             references public.trip(id) on delete set null,
    purchased_stop_id uuid            not null references public.stop(id) on delete cascade,
    template_id      uuid             not null references public.stop_challenge(id) on delete cascade,
    status           challenge_status not null default 'pending',
    exp_reward       int4             not null check (exp_reward >= 0),
    points_reward    int4             not null check (points_reward >= 0),
    completed_at     timestamptz,
    created_at       timestamptz      not null default now(),
    unique (purchased_stop_id, template_id)
);

-- reward_ledger: auditable EXP/points adjustments
create table public.reward_ledger (
    id                    uuid        primary key default gen_random_uuid(),
    user_id               uuid        not null references public.profile(id) on delete cascade,
    challenge_instance_id uuid        references public.challenge_instance(id) on delete set null,
    exp_delta             int4        not null,
    points_delta          int4        not null,
    reason                text,
    created_at            timestamptz not null default now(),
    constraint reward_ledger_nonzero check (exp_delta <> 0 or points_delta <> 0)
);

-- voucher: redeemable offers tied to places/restaurants
create table public.voucher (
    id          uuid          primary key default gen_random_uuid(),
    place_id    text          not null references public.place(id) on delete cascade,
    title       text          not null,
    description text,
    points_cost int4          not null check (points_cost >= 0),
    stock       int4          not null check (stock >= 0),
    status      voucher_status not null default 'active',
    valid_from  timestamptz,
    valid_to    timestamptz,
    created_at  timestamptz   not null default now()
);

-- voucher_redemption: user redemptions of vouchers
create table public.voucher_redemption (
    id           uuid             primary key default gen_random_uuid(),
    user_id      uuid             not null references public.profile(id) on delete cascade,
    voucher_id   uuid             not null references public.voucher(id) on delete cascade,
    points_spent int4             not null check (points_spent >= 0),
    status       redemption_status not null default 'reserved',
    redeemed_at  timestamptz,
    created_at   timestamptz      not null default now()
);

-- ── Functions ─────────────────────────────────────────────────────────────────

-- Simple EXP -> level formula (adjust EXP_PER_LEVEL as needed)
create or replace function public.calculate_level(exp_total int4)
returns int2
language sql
immutable
as $$
    select greatest(1, floor(exp_total / 100)::int + 1)::int2;
$$;

-- Ensure progress row exists for every profile, populate data for new user
create or replace function public.ensure_user_progress()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    v_badge_id uuid;
begin
    select id
    into v_badge_id
    from public.badge_tier
    order by min_exp asc, rank asc
    limit 1;

    insert into public.user_progress (user_id, exp_total, level, badge_tier_id, points_balance)
    values (new.id, 0, 1, v_badge_id, 0)
    on conflict (user_id) do nothing;
    return new;
end;
$$;

create trigger set_updated_at before update on public.user_progress
    for each row execute procedure public.set_updated_at();

create trigger on_profile_insert_progress
    after insert on public.profile
    for each row execute procedure public.ensure_user_progress();

-- Validate stop_challenge uses plan stops only
create or replace function public.validate_stop_challenge_plan_stop()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    v_plan_id uuid;
begin
    select plan_id into v_plan_id
    from public.stop
    where id = new.plan_stop_id;

    if v_plan_id is null then
        raise exception 'stop_challenge requires a plan stop';
    end if;

    return new;
end;
$$;

create trigger on_stop_challenge_validate
    before insert or update on public.stop_challenge
    for each row execute procedure public.validate_stop_challenge_plan_stop();

/* Legacy workflow (moved to backend):
-- Seed challenge instances when a purchased stop is created
create or replace function public.seed_challenge_instances()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    v_plan_stop_id uuid;
    v_trip_id uuid;
begin
    if new.purchased_plan_id is null then
        return new;
    end if;

    select s.id
    into v_plan_stop_id
    from public.stop s
    join public.purchased_plan pp on pp.plan_id = s.plan_id
    where pp.id = new.purchased_plan_id
      and s.stop_order = new.stop_order
      and s.plan_id is not null
    limit 1;

    if v_plan_stop_id is null then
        return new;
    end if;

    select t.id
    into v_trip_id
    from public.trip t
    where t.purchased_plan_id = new.purchased_plan_id
      and t.status = 'active'
    limit 1;

    insert into public.challenge_instance
        (user_id, trip_id, purchased_stop_id, template_id, status, exp_reward, points_reward)
    select
        pp.user_id,
        v_trip_id,
        new.id,
        sc.id,
        'pending',
        sc.exp_reward,
        sc.points_reward
    from public.stop_challenge s
    join public.purchased_plan pp on pp.id = new.purchased_plan_id
    where sc.plan_stop_id = v_plan_stop_id
      and sc.active = true
    on conflict do nothing;

    return new;
end;
$$;

create trigger on_stop_insert_seed_challenges
    after insert on public.stop
    for each row execute procedure public.seed_challenge_instances();
*/

/* Legacy workflow (moved to backend):
-- Backfill instances when a new challenge is added to a plan stop
create or replace function public.backfill_challenge_instances()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.challenge_instance
        (user_id, trip_id, purchased_stop_id, template_id, status, exp_reward, points_reward)
    select
        pp.user_id,
        t.id,
        ps.id,
        new.id,
        'pending',
        new.exp_reward,
        new.points_reward
    from public.stop plan_stop
    join public.purchased_plan pp on pp.plan_id = plan_stop.plan_id
    join public.stop ps on ps.purchased_plan_id = pp.id and ps.stop_order = plan_stop.stop_order
    left join public.trip t on t.purchased_plan_id = pp.id and t.status = 'active'
    where plan_stop.id = new.plan_stop_id
    on conflict do nothing;

    return new;
end;
$$;

create trigger on_stop_challenge_insert_backfill
    after insert on public.stop_challenge
    for each row execute procedure public.backfill_challenge_instances();
*/

/* Legacy workflow (moved to backend):
-- Attach challenge instances to a trip once the trip is created, its value is null when challenge is attached
-- with the purchased stops
create or replace function public.attach_trip_challenges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    update public.challenge_instance ci
    set trip_id = new.id
    where ci.trip_id is null
      and ci.user_id = new.user_id
      and exists (
          select 1
          from public.stop s
          where s.id = ci.purchased_stop_id
            and s.purchased_plan_id = new.purchased_plan_id
      );

    return new;
end;
$$;

create trigger on_trip_insert_attach_challenges
    after insert on public.trip
    for each row execute procedure public.attach_trip_challenges();
*/

/* Legacy workflow (moved to backend):
-- Auto-set completed_at when status becomes completed
create or replace function public.set_challenge_completed_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.status = 'completed' and old.status <> 'completed' and new.completed_at is null then
        new.completed_at = now();
    end if;
    return new;
end;
$$;

create trigger on_challenge_instance_set_completed_at
    before update of status on public.challenge_instance
    for each row execute procedure public.set_challenge_completed_at();
*/

/* Legacy workflow (moved to backend):
-- Award rewards on completion
create or replace function public.handle_challenge_completion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.status = 'completed' and old.status <> 'completed' then
        insert into public.reward_ledger (user_id, challenge_instance_id, exp_delta, points_delta, reason)
        values (new.user_id, new.id, new.exp_reward, new.points_reward, 'challenge_completed');
    end if;
    return new;
end;
$$;

create trigger on_challenge_instance_complete
    after update of status on public.challenge_instance
    for each row execute procedure public.handle_challenge_completion();
*/

-- Apply reward ledger deltas to user_progress + badge tier
create or replace function public.apply_reward_ledger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    v_exp int4;
    v_points int4;
    v_level int2;
    v_badge_id uuid;
begin
    insert into public.user_progress (user_id, exp_total, points_balance, level)
    values (new.user_id, new.exp_delta, new.points_delta, 1)
    on conflict (user_id) do update
        set exp_total = public.user_progress.exp_total + new.exp_delta,
            points_balance = public.user_progress.points_balance + new.points_delta
    returning exp_total, points_balance into v_exp, v_points;

    if v_exp < 0 or v_points < 0 then
        raise exception 'negative exp/points not allowed';
    end if;

    v_level := public.calculate_level(v_exp);

    select id
    into v_badge_id
    from public.badge_tier
    where min_exp <= v_exp
    order by min_exp desc, rank desc
    limit 1;

    update public.user_progress
    set level = v_level,
        badge_tier_id = v_badge_id
    where user_id = new.user_id;

    return new;
end;
$$;

create trigger on_reward_ledger_apply
    after insert on public.reward_ledger
    for each row execute procedure public.apply_reward_ledger();

/* Legacy workflow (moved to backend):
-- Validate and apply voucher redemption
create or replace function public.handle_voucher_redemption()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    v_cost int4;
    v_stock int4;
    v_status voucher_status;
    v_balance int4;
begin
    select points_cost, stock, status
    into v_cost, v_stock, v_status
    from public.voucher
    where id = new.voucher_id
    for update;

    if v_status <> 'active' then
        raise exception 'voucher is not active';
    end if;

    if v_stock <= 0 then
        raise exception 'voucher out of stock';
    end if;

    select points_balance
    into v_balance
    from public.user_progress
    where user_id = new.user_id
    for update;

    if v_balance is null or v_balance < v_cost then
        raise exception 'insufficient points';
    end if;

    new.points_spent = v_cost;

    update public.voucher
    set stock = stock - 1
    where id = new.voucher_id;

    insert into public.reward_ledger (user_id, challenge_instance_id, exp_delta, points_delta, reason)
    values (new.user_id, null, 0, -v_cost, 'voucher_redemption');

    return new;
end;
$$;

create trigger on_voucher_redemption_insert
    before insert on public.voucher_redemption
    for each row execute procedure public.handle_voucher_redemption();
*/

/* Legacy workflow (moved to backend):
-- Refund points on cancellation
create or replace function public.handle_voucher_cancellation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.status = 'cancelled' and old.status <> 'cancelled' then
        update public.voucher
        set stock = stock + 1
        where id = new.voucher_id;

        insert into public.reward_ledger (user_id, challenge_instance_id, exp_delta, points_delta, reason)
        values (new.user_id, null, 0, new.points_spent, 'voucher_redemption_cancelled');
    end if;

    return new;
end;
$$;

create trigger on_voucher_redemption_update
    after update of status on public.voucher_redemption
    for each row execute procedure public.handle_voucher_cancellation();
*/

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.badge_tier         enable row level security;
alter table public.user_progress      enable row level security;
alter table public.stop_challenge     enable row level security;
alter table public.challenge_instance enable row level security;
alter table public.reward_ledger      enable row level security;
alter table public.voucher            enable row level security;
alter table public.voucher_redemption enable row level security;

-- badge_tier: public read
create policy "badge_tier_select_all" on public.badge_tier for select using (true);

-- user_progress: own read
create policy "user_progress_select_own" on public.user_progress for select to authenticated
    using ((select auth.uid()) = user_id);

-- stop_challenge: readable when parent plan visible; writable by creator
create policy "stop_challenge_select" on public.stop_challenge for select
    using (exists (
        select 1
        from public.stop s
        join public.plan p on p.id = s.plan_id
        where s.id = plan_stop_id and (p.status = 'published' or (select auth.uid()) = p.creator_id)
    ));
create policy "stop_challenge_write" on public.stop_challenge for all to authenticated
    using (exists (
        select 1
        from public.stop s
        join public.plan p on p.id = s.plan_id
        where s.id = plan_stop_id and (select auth.uid()) = p.creator_id
    ));

-- challenge_instance: own rows only
create policy "challenge_instance_all" on public.challenge_instance for all to authenticated
    using ((select auth.uid()) = user_id);

-- reward_ledger: own read only
create policy "reward_ledger_select_own" on public.reward_ledger for select to authenticated
    using ((select auth.uid()) = user_id);

-- voucher: public read
create policy "voucher_select_all" on public.voucher for select using (true);

-- voucher_redemption: own rows only
create policy "voucher_redemption_all" on public.voucher_redemption for all to authenticated
    using ((select auth.uid()) = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index on public.stop_challenge (plan_stop_id, active);
create index on public.challenge_instance (user_id, status);
create index on public.challenge_instance (trip_id);
create index on public.challenge_instance (purchased_stop_id);
create index on public.reward_ledger (user_id, created_at);
create index on public.voucher (place_id, status);
create index on public.voucher_redemption (user_id, redeemed_at);
