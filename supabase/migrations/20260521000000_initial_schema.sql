-- ECSATrail — Initial Schema
-- AI travel companion platform: plans, marketplace, trips, AI chat, re-planning

-- ── Extensions ────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── Enums ─────────────────────────────────────────────────────────────────────

create type place_category      as enum ('temple','nature','beach','museum','food','market','cave');
create type place_source_type   as enum ('google_places','facebook','blog','tripadvisor');
create type plan_difficulty     as enum ('easy','moderate','challenging');
create type plan_category       as enum ('cultural','nature','food','adventure','beach','city');
create type plan_status         as enum ('draft','published','archived');
create type transport_mode      as enum ('walk','taxi','motorbike','bus');
create type trip_status         as enum ('active','completed','cancelled');
create type plan_variant        as enum ('a','b');
create type weather_type        as enum ('rain','storm','clear');
create type alert_severity      as enum ('low','medium','high');
create type alert_decision      as enum ('accepted','rejected');
create type chat_role           as enum ('user','assistant','tool');
create type ai_tier             as enum ('per-plan','monthly');
create type subscription_status as enum ('active','cancelled','expired');

-- ── Tables ────────────────────────────────────────────────────────────────────

-- profile: extends auth.users — every authenticated user is a potential creator
create table public.profile (
    id           uuid        primary key references auth.users(id) on delete cascade,
    name         text        not null,
    avatar_url   text,
    bio          text,
    province     text,
    verified     boolean     not null default false,
    -- denormalized aggregates, maintained by triggers
    total_plans  int4        not null default 0,
    total_sales  int4        not null default 0,
    rating       numeric(3,2) not null default 0,
    review_count int4        not null default 0,
    joined_at    timestamptz not null default now()
);

-- place: verified landmark / point-of-interest
create table public.place (
    id                text        primary key,   -- e.g. 'hoan-kiem'
    name              text        not null,      -- Vietnamese name
    name_en           text        not null,
    province          text        not null,
    lat               float8      not null,
    lng               float8      not null,
    category          place_category not null,
    credibility_score int2        not null check (credibility_score between 0 and 100),
    sources_count     int2        not null default 0,
    -- computed: true when sources_count >= 3 (Common Denominator Rule)
    source_verified   boolean     not null generated always as (sources_count >= 3) stored,
    description       text,
    image_url         text,
    duration_hours    float4,
    indoor            boolean     not null default false,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

-- place_source: tracks which external sources verified each place
create table public.place_source (
    id          uuid            primary key default gen_random_uuid(),
    place_id    text            not null references public.place(id) on delete cascade,
    source_type place_source_type not null,
    source_url  text,
    fetched_at  timestamptz     not null default now()
);

-- plan: creator-published travel plan listed on the marketplace
create table public.plan (
    id                 uuid           primary key default gen_random_uuid(),
    creator_id         uuid           not null references public.profile(id) on delete cascade,
    title              text           not null,
    title_vi           text,
    price              numeric(10,2)  not null default 0 check (price >= 0),
    province           text           not null,      -- primary province
    provinces          text[]         not null default '{}',  -- all provinces covered
    duration_days      int2           not null check (duration_days > 0),
    difficulty         plan_difficulty not null default 'easy',
    category           plan_category  not null,
    cover_image_url    text,
    highlights         text[]         not null default '{}',
    highlights_vi      text[]         not null default '{}',
    tags               text[]         not null default '{}',
    ai_verified        boolean        not null default false,
    fact_checked       boolean        not null default false,
    includes_transport boolean        not null default false,
    includes_tips      boolean        not null default false,
    includes_media     boolean        not null default false,
    status             plan_status    not null default 'draft',
    -- denormalized aggregates, maintained by triggers
    purchase_count     int4           not null default 0,
    rating             numeric(3,2)   not null default 0,
    review_count       int4           not null default 0,
    created_at         timestamptz    not null default now(),
    updated_at         timestamptz    not null default now()
);

-- stop: unified table for plan stops, user-customized stops, and Plan B alert stops.
-- Exactly one of (plan_id, purchased_plan_id, alert_id) must be set per row.
create table public.stop (
    id                uuid           primary key default gen_random_uuid(),
    -- context — exactly one set (enforced below)
    plan_id           uuid           references public.plan(id) on delete cascade,
    purchased_plan_id uuid           references public.purchased_plan(id) on delete cascade,
    alert_id          uuid           references public.weather_alert(id) on delete cascade,
    -- Plan B only: which purchased stop this row replaces
    replaces_stop_id  uuid           references public.stop(id) on delete set null,
    -- stop payload
    place_id          text           not null references public.place(id),
    stop_order        int2           not null,
    travel_time_min   int2           not null default 0,
    transport_mode    transport_mode not null default 'walk',
    notes             text,
    constraint stop_single_owner check (
        (plan_id is not null)::int +
        (purchased_plan_id is not null)::int +
        (alert_id is not null)::int = 1
    )
);
create unique index stop_plan_order      on public.stop (plan_id, stop_order)           where plan_id           is not null;
create unique index stop_purchased_order on public.stop (purchased_plan_id, stop_order) where purchased_plan_id is not null;

-- purchased_plan: user owns a plan (may not yet be on a trip)
create table public.purchased_plan (
    id           uuid        primary key default gen_random_uuid(),
    user_id      uuid        not null references public.profile(id) on delete cascade,
    plan_id      uuid        not null references public.plan(id),
    purchased_at timestamptz not null default now(),
    ai_tier      ai_tier,       -- per-plan AI purchase, null if user has monthly subscription
    notes        text,
    unique (user_id, plan_id)  -- one ownership record per user per plan
);


-- trip: user's active / completed journey
create table public.trip (
    id                uuid        primary key default gen_random_uuid(),
    user_id           uuid        not null references public.profile(id) on delete cascade,
    purchased_plan_id uuid        not null references public.purchased_plan(id),
    start_date        date        not null,
    end_date          date,
    status            trip_status not null default 'active',
    active_plan       plan_variant not null default 'a',  -- 'a' = original, 'b' = weather-adapted
    push_subscription jsonb,                              -- Web Push subscription for re-planning alerts
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);
-- only one active trip per user at a time
create unique index trip_one_active_per_user on public.trip (user_id) where (status = 'active');

-- weather_alert: autonomous re-planning trigger generated by Edge Function poller
create table public.weather_alert (
    id                  uuid           primary key default gen_random_uuid(),
    trip_id             uuid           not null references public.trip(id) on delete cascade,
    type                weather_type   not null,
    severity            alert_severity not null,
    message             text           not null,
    message_vi          text,
    affected_place_ids  text[]         not null default '{}',
    plan_b_generated    boolean        not null default false,
    user_decision       alert_decision,  -- null = pending, accepted/rejected after user reviews
    created_at          timestamptz    not null default now()
);


-- review: consumer feedback on published plans
create table public.review (
    id            uuid        primary key default gen_random_uuid(),
    user_id       uuid        not null references public.profile(id) on delete cascade,
    plan_id       uuid        not null references public.plan(id) on delete cascade,
    rating        int2        not null check (rating between 1 and 5),
    comment       text,
    comment_vi    text,
    helpful_count int4        not null default 0,
    created_at    timestamptz not null default now(),
    unique (user_id, plan_id)  -- one review per user per plan
);

-- chat_session: persisted AI conversation context per user
create table public.chat_session (
    id         uuid        primary key default gen_random_uuid(),
    user_id    uuid        not null references public.profile(id) on delete cascade,
    plan_id    uuid        references public.plan(id) on delete set null,  -- optional plan context
    title      text,       -- auto-generated summary title
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- chat_message: individual messages within a session
create table public.chat_message (
    id          uuid        primary key default gen_random_uuid(),
    session_id  uuid        not null references public.chat_session(id) on delete cascade,
    role        chat_role   not null,
    content     text        not null,
    tool_name   text,       -- for role = 'tool'
    tool_input  jsonb,
    tool_output jsonb,
    created_at  timestamptz not null default now()
);

-- ai_subscription: monthly AI premium subscription (per-plan tier stored on purchased_plan)
create table public.ai_subscription (
    id                     uuid                primary key default gen_random_uuid(),
    user_id                uuid                not null references public.profile(id) on delete cascade,
    status                 subscription_status not null default 'active',
    payment_service_subscription_id text,
    current_period_end     timestamptz,
    created_at             timestamptz         not null default now(),
    updated_at             timestamptz         not null default now()
);
-- only one active subscription per user at a time
create unique index ai_subscription_one_active_per_user on public.ai_subscription (user_id) where (status = 'active');

-- ── Triggers ──────────────────────────────────────────────────────────────────

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger set_updated_at before update on public.place
    for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.plan
    for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.trip
    for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.chat_session
    for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.ai_subscription
    for each row execute procedure public.set_updated_at();

-- Auto-create profile row when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
    insert into public.profile (id, name)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Seed user's customized stops (purchased context) from plan's original stops on purchase
create or replace function public.seed_purchased_plan_stops()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
    insert into public.stop
        (purchased_plan_id, place_id, stop_order, travel_time_min, transport_mode, notes)
    select
        new.id, s.place_id, s.stop_order, s.travel_time_min, s.transport_mode, s.notes
    from public.stop s
    where s.plan_id = new.plan_id;
    return new;
end;
$$;

create trigger on_plan_purchased
    after insert on public.purchased_plan
    for each row execute procedure public.seed_purchased_plan_stops();

-- Increment plan.purchase_count + creator profile.total_sales on purchase
create or replace function public.handle_plan_purchase()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
    update public.plan
    set purchase_count = purchase_count + 1
    where id = new.plan_id;

    update public.profile
    set total_sales = total_sales + 1
    where id = (select creator_id from public.plan where id = new.plan_id);

    return new;
end;
$$;

create trigger on_purchased_plan_insert
    after insert on public.purchased_plan
    for each row execute procedure public.handle_plan_purchase();

-- Recalculate plan.rating + plan.review_count + creator profile aggregates on new review
create or replace function public.handle_new_review()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
    v_creator_id uuid;
    v_old_count  int4;
    v_old_rating numeric(3,2);
begin
    select creator_id, review_count, rating
    into v_creator_id, v_old_count, v_old_rating
    from public.plan where id = new.plan_id;

    update public.plan set
        review_count = v_old_count + 1,
        rating       = (v_old_rating * v_old_count + new.rating) / (v_old_count + 1)
    where id = new.plan_id;

    -- recompute creator's aggregate rating across all their plans
    update public.profile set
        review_count = review_count + 1,
        rating = (
            select coalesce(avg(p.rating), 0)
            from public.plan p
            where p.creator_id = v_creator_id and p.review_count > 0
        )
    where id = v_creator_id;

    return new;
end;
$$;

create trigger on_review_insert
    after insert on public.review
    for each row execute procedure public.handle_new_review();

-- Maintain profile.total_plans + auto-purchase own plan when creator publishes
create or replace function public.handle_plan_status_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
    if new.status = 'published' and old.status <> 'published' then
        update public.profile set total_plans = total_plans + 1 where id = new.creator_id;

        -- Auto-create a purchased_plan for the creator so they can start a trip
        -- with their own plan without going through the marketplace checkout.
        insert into public.purchased_plan (user_id, plan_id, ai_tier)
        values (new.creator_id, new.id, null)
        on conflict (user_id, plan_id) do nothing;

    elsif old.status = 'published' and new.status <> 'published' then
        update public.profile set total_plans = greatest(total_plans - 1, 0) where id = new.creator_id;
    end if;
    return new;
end;
$$;

create trigger on_plan_status_update
    after update of status on public.plan
    for each row execute procedure public.handle_plan_status_change();

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.profile              enable row level security;
alter table public.place                enable row level security;
alter table public.place_source         enable row level security;
alter table public.plan                 enable row level security;
alter table public.stop                 enable row level security;
alter table public.purchased_plan       enable row level security;
alter table public.trip                 enable row level security;
alter table public.weather_alert        enable row level security;
alter table public.review               enable row level security;
alter table public.chat_session         enable row level security;
alter table public.chat_message         enable row level security;
alter table public.ai_subscription      enable row level security;

-- profile: all profiles readable (public marketplace); only own row writable
create policy "profile_select_all"  on public.profile for select using (true);
create policy "profile_update_own"  on public.profile for update to authenticated
    using ((select auth.uid()) = id);

-- place + place_source: public read; writes via service role only (ingestion pipeline)
create policy "place_select_all"        on public.place        for select using (true);
create policy "place_source_select_all" on public.place_source for select using (true);

-- plan: published plans + own drafts visible; mutations only by creator
create policy "plan_select" on public.plan for select
    using (status = 'published' or (select auth.uid()) = creator_id);
create policy "plan_insert" on public.plan for insert to authenticated
    with check ((select auth.uid()) = creator_id);
create policy "plan_update" on public.plan for update to authenticated
    using ((select auth.uid()) = creator_id);
create policy "plan_delete" on public.plan for delete to authenticated
    using ((select auth.uid()) = creator_id);

-- stop: split by which FK is set
-- plan stops — visible when plan is visible; writable by creator
create policy "stop_plan_select" on public.stop for select
    using (
        plan_id is null or exists (
            select 1 from public.plan p
            where p.id = plan_id and (p.status = 'published' or (select auth.uid()) = p.creator_id)
        )
    );
create policy "stop_plan_write" on public.stop for all to authenticated
    using (
        plan_id is not null and exists (
            select 1 from public.plan p where p.id = plan_id and (select auth.uid()) = p.creator_id
        )
    );
-- purchased stops — own rows only
create policy "stop_purchased_all" on public.stop for all to authenticated
    using (
        purchased_plan_id is not null and exists (
            select 1 from public.purchased_plan pp
            where pp.id = purchased_plan_id and (select auth.uid()) = pp.user_id
        )
    );
-- alert stops — readable by trip owner
create policy "stop_alert_select" on public.stop for select to authenticated
    using (
        alert_id is not null and exists (
            select 1 from public.weather_alert wa
            join public.trip t on t.id = wa.trip_id
            where wa.id = alert_id and (select auth.uid()) = t.user_id
        )
    );

-- purchased_plan: own rows only
create policy "purchased_plan_select" on public.purchased_plan for select to authenticated
    using ((select auth.uid()) = user_id);
create policy "purchased_plan_insert" on public.purchased_plan for insert to authenticated
    with check ((select auth.uid()) = user_id);

-- trip: own rows only
create policy "trip_all" on public.trip for all to authenticated
    using ((select auth.uid()) = user_id);

-- weather_alert: readable/updatable by trip owner
create policy "weather_alert_select" on public.weather_alert for select to authenticated
    using (exists (
        select 1 from public.trip t where t.id = trip_id and (select auth.uid()) = t.user_id
    ));
create policy "weather_alert_update" on public.weather_alert for update to authenticated
    using (exists (
        select 1 from public.trip t where t.id = trip_id and (select auth.uid()) = t.user_id
    ));


-- review: public read; own write (one per user per plan enforced by unique constraint)
create policy "review_select_all" on public.review for select using (true);
create policy "review_insert"     on public.review for insert to authenticated
    with check ((select auth.uid()) = user_id);
create policy "review_update"     on public.review for update to authenticated
    using ((select auth.uid()) = user_id);
create policy "review_delete"     on public.review for delete to authenticated
    using ((select auth.uid()) = user_id);

-- chat_session + chat_message: own rows only
create policy "chat_session_all" on public.chat_session for all to authenticated
    using ((select auth.uid()) = user_id);
create policy "chat_message_all" on public.chat_message for all to authenticated
    using (exists (
        select 1 from public.chat_session cs
        where cs.id = session_id and (select auth.uid()) = cs.user_id
    ));

-- ai_subscription: own rows only
create policy "ai_subscription_select" on public.ai_subscription for select to authenticated
    using ((select auth.uid()) = user_id);

-- ── Views ─────────────────────────────────────────────────────────────────────

-- province_stats: aggregated landmark data by province (backs FrequencyDashboard)
create view public.province_stats as
select
    p.province,
    count(distinct p.id)                                                           as landmarks,
    round(avg(p.credibility_score))                                                as avg_credibility,
    count(distinct ps.id) filter (where ps.source_type = 'facebook')               as facebook_hits,
    count(distinct ps.id) filter (where ps.source_type = 'google_places')          as google_maps_hits,
    count(distinct ps.id) filter (where ps.source_type = 'blog')                   as blog_hits
from public.place p
left join public.place_source ps on ps.place_id = p.id
group by p.province;

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index on public.plan (creator_id);
create index on public.plan (status);
create index on public.plan (province);
create index on public.plan (category);
create index on public.stop (plan_id)           where plan_id           is not null;
create index on public.stop (purchased_plan_id) where purchased_plan_id is not null;
create index on public.stop (alert_id)          where alert_id          is not null;
create index on public.stop (replaces_stop_id)  where replaces_stop_id  is not null;
create index on public.purchased_plan (user_id);
create index on public.purchased_plan (plan_id);
create index on public.trip (user_id, status);
create index on public.trip (purchased_plan_id);
create index on public.weather_alert (trip_id);
create index on public.review (plan_id);
create index on public.review (user_id);
create index on public.chat_session (user_id);
create index on public.chat_message (session_id, created_at);
create index on public.ai_subscription (user_id, status);
create index on public.place_source (place_id);
