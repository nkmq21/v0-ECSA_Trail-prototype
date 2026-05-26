# Authentication Implementation Plan

## Context

Branch `authentication`. Goal: wire real Supabase auth (email/password + Google OAuth) into the
prototype. Actual UI stack: shadcn/ui (Radix + Tailwind v4) + react-hook-form + zod + sonner +
lucide-react. **Not Mantine** — spec mentioned Mantine but actual codebase differs; plan follows
actual stack.

**Next.js 16 key fact**: In v16, `middleware.ts` was renamed to `proxy.ts` and export renamed from
`middleware` to `proxy`. The project's `proxy.ts` with `export async function proxy(...)` is
**already correct Next.js 16 middleware** — it IS active. No `middleware.ts` needed.

**One bug found**: `/dashboard` was in `publicRoutes` in `utils/supabase/proxy.ts` — dashboard
routes were unprotected. **Fixed** in this branch.

**Auth layout**: `app/(auth)/` as top-level route group, NOT nested inside `app/(public)/`.
Reason: `(public)/layout.tsx` wraps with AppShell (nav tabs) — auth pages must not show nav.

---

## Phase 1 — Auth Pages (DONE)

### Files created

| File | Purpose |
|------|---------|
| `app/(auth)/layout.tsx` | Standalone centered layout — dot-grid bg, gradient orbs, no NavBar |
| `app/(auth)/login/page.tsx` + `LoginForm.tsx` | Sign-in: email/password + Google OAuth, password show/hide, sonner errors |
| `app/(auth)/signup/page.tsx` + `SignupForm.tsx` | Sign-up: name/email/password/confirm + animated "check email" confirmation state |
| `app/(auth)/callback/route.ts` | PKCE OAuth code exchange → `/marketplace` (user-updated) |
| `app/api/auth/signout/route.ts` | POST → signOut → redirect `/login` |

### Files modified

- `utils/supabase/proxy.ts`:
  - Removed `/dashboard` from `publicRoutes` (was accidentally open)
  - Added `/signup` + `/callback`
  - Fixed logged-in redirect to `/dashboard/chat`

### Backend steps (manual — do in Supabase dashboard)

1. Apply `supabase/migrations/20260524000000_drop_business_logic_triggers.sql` → run `npm run gen:types`
2. Dashboard → Authentication → Providers → Email → Enable
3. Google OAuth: Google Cloud Console → OAuth 2.0 credentials (Web) → authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` → paste into Supabase → Enable
4. Dashboard → Authentication → URL Configuration → Site URL `http://localhost:3000` → add Redirect URL `http://localhost:3000/callback`
5. `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Phase 2 — NavBar Real Auth + Credits

### Context

NavBar (`components/layouts/NavBar.tsx`) uses mock `UserContext` (hardcoded "Alex Nguyen",
`walletBalance: 50`). Auth is now wired. Need to replace mock with real Supabase user + define
credits correctly.

**Credits decision:** No monetary wallet exists in schema. `user_progress.points_balance` (int4,
gamification migration) IS the correct credits concept — earned from challenges, spent on vouchers.
Mock "ECSACredits" dollar wallet contradicts CLAUDE.md ("plans are free, no platform fee"). Replace
dollar wallet display with gamification points.

**Trigger bug found:** `handle_new_user` only inserts `id` + `name`. Does NOT sync `avatar_url`
from Google OAuth `raw_user_meta_data->>'avatar_url'`. Needs migration fix.

---

### New migration: `supabase/migrations/20260525000000_fix_handle_new_user_avatar.sql`

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.profile (id, name, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$;
```

Does NOT re-create the trigger (already exists). Just replaces the function body.
Run `npm run gen:types` after applying.

---

### `components/ui/UserContext.tsx` — replace mock with real Supabase

Replace entire file. Keep `useUser()` export so NavBar import is unchanged.

New context shape:
```ts
type UserProfile = {
    id: string
    name: string
    avatarUrl: string | null
    bio: string | null
    province: string | null
    verified: boolean
    joinedAt: string          // formatted: "May 2026"
    pointsBalance: number     // from user_progress.points_balance
    level: number             // from user_progress.level
}

type UserContextValue = {
    user: User | null         // supabase auth user
    profile: UserProfile | null
    isLoading: boolean
}
```

Implementation:
- `useEffect` → `supabase.auth.getUser()` for initial state
- `supabase.auth.onAuthStateChange` for live session updates
- On user present: `Promise.all` fetch `profile` + `user_progress` rows
- On sign-out: clear profile state
- Remove `walletBalance`, `purchasePlan`, `topUpWallet`, `ownedPlanIds` — mock business logic, contradicts spec

Fetch:
```ts
supabase.from('profile').select('*').eq('id', userId).single()
supabase.from('user_progress').select('points_balance, level, exp_total').eq('user_id', userId).single()
```

`user_progress` row auto-created by `ensure_user_progress` trigger (gamification migration).
Use `?? 0` fallback if row absent.

---

### `components/layouts/NavBar.tsx` — wire real data

| What | Before | After |
|------|--------|-------|
| Credits chip | green pill `$${walletBalance.toFixed(2)}` | amber pill `⭐ ${pointsBalance} pts` |
| Avatar | initials from mock name | `<img src={avatarUrl}>` with initials fallback |
| Logged-out | nothing | `<Button asChild><Link href="/login">Sign in</Link></Button>` |
| Sign-out | none | button in Sheet footer → `supabase.auth.signOut()` |
| Top-up buttons | $10/$20/$50 buttons | removed |
| My Plans in sheet | mock `MOCK_PLANS` list | removed (lives in my-plans route) |
| Loading | instant mock | skeleton pulse on avatar + chip |

Sign-out: call `createClientClient().auth.signOut()` directly (no POST to `/api/auth/signout`
needed — client signOut clears cookies; proxy refreshes on next request).

---

### Files to create/modify

| File | Action |
|------|--------|
| `supabase/migrations/20260525000000_fix_handle_new_user_avatar.sql` | Create — fix trigger |
| `components/ui/UserContext.tsx` | Rewrite — real Supabase auth |
| `components/layouts/NavBar.tsx` | Update — real profile data, points chip, sign-in/out |

---

## Verification

### Phase 1
1. `pnpm dev` — zero new TS errors
2. `/login` → form renders, NO AppShell nav tabs visible
3. `/dashboard/my-plans` without session → redirects to `/login`
4. Sign up with email → confirmation notice (no redirect)
5. Sign in → lands on `/marketplace` (callback updated)
6. Google OAuth → `/callback` → session set → marketplace
7. POST `/api/auth/signout` → redirects to `/login`, session cleared

### Phase 2
1. Sign in → NavBar shows real name + avatar (or initials)
2. NavBar shows `X pts` chip (not dollar amount)
3. Sign out button in profile sheet works
4. Logged-out state → "Sign in" button visible in NavBar
5. Profile sheet shows real bio, province, joined date
