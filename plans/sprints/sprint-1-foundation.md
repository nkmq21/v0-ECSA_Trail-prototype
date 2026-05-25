# Sprint 1 — Foundation & Migration

**Week:** 1  
**Goal:** App runs with real Supabase auth, Mantine v9 UI, correct `src/` directory structure, and all external API keys configured in `.env`.  
**Both devs work in parallel — no feature dependencies between A and B this week.**

---

## Dev A — Project Structure · Auth · Backend Setup

### Day 1–2: `src/` restructure + config

**Move all source files under `src/`:**
```
app/          → src/app/
components/   → src/components/
lib/          → src/lib/
utils/        → src/utils/
services/     → src/services/
types/        → src/types/
hooks/        → src/hooks/
```
- Update `tsconfig.json`: `"paths": { "@/*": ["./src/*"] }`
- Update `next.config.ts` if needed
- Move root `database.types.ts` → `src/types/database.types.ts`
- Update all `@/` imports (use IDE rename or `find/sed`)
- Update `package.json` scripts paths if any reference `./utils` or `./lib` directly
- Run `npx.cmd tsc --noEmit` — fix all import errors before proceeding

**Create `.env.local` template (`.env.example`):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GEMINI_API_KEY=           # For client display only — actual key server-side
GEMINI_API_KEY=                       # Server-side only
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
OPENWEATHERMAP_API_KEY=
SEPAY_API_KEY=
SEPAY_WEBHOOK_SECRET=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```
Set up all available keys in `.env.local` (Supabase is minimum for Sprint 1).

### Day 2–3: Supabase Auth — login/signup pages

**Files to create:**
```
src/app/(public)/(auth)/login/page.tsx
src/app/(public)/(auth)/login/LoginForm.tsx
src/app/(public)/(auth)/signup/page.tsx
src/app/(public)/(auth)/signup/SignupForm.tsx
src/app/(public)/(auth)/callback/route.ts        ← OAuth redirect handler
src/app/api/auth/signout/route.ts
```

**LoginForm.tsx** — Mantine `TextInput`, `PasswordInput`, `Button` (use Mantine, NOT shadcn):
- Email + password sign-in via `supabase.auth.signInWithPassword()`
- Google OAuth button → `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: callback })`
- Error display via `showNotificationFromAssertion` (or inline Mantine `Alert`)
- Redirect to `/dashboard/chat` on success

**SignupForm.tsx**:
- Email + password + full name
- `supabase.auth.signUp()` → profile row auto-created by `handle_new_user` trigger
- Post-signup → email confirmation notice (Mantine `Alert` info)

**OAuth callback** (`src/app/(public)/(auth)/callback/route.ts`):
```ts
// Standard Supabase PKCE callback
import { createClient } from '@/utils/supabase/server'
// exchange code → session, redirect to /dashboard/chat
```

**Middleware** (`src/middleware.ts`):
- Protect all `/dashboard/**` routes — redirect to `/login` if no session
- Public: `/`, `/marketplace`, `/plan/[id]`, `/login`, `/signup`, `/api/auth/**`
- Use `updateSession()` from `src/utils/supabase/server.ts` (Supabase middleware pattern)

### Day 3–4: actionWrapper + errors + GenericResponse (already partially exists — verify + complete)

**Verify `src/utils/actionWrapper.ts`** works with new `src/` paths:
- `verifyUser()` reads session from server Supabase client
- Zod validation applied before handler
- All errors wrapped in `GenericResponse` shape

**`src/lib/errors.ts`** — add `AppSuccessCodes`, `AppErrorCodes`, `AppInfoCodes` enums if not complete:
```ts
export enum AppSuccessCodes { CREATED = 'CREATED', UPDATED = 'UPDATED', DELETED = 'DELETED', OK = 'OK' }
export enum AppErrorCodes { UNAUTHORIZED = 'UNAUTHORIZED', NOT_FOUND = 'NOT_FOUND', VALIDATION = 'VALIDATION', AI_PREMIUM_REQUIRED = 'AI_PREMIUM_REQUIRED', PAYMENT_FAILED = 'PAYMENT_FAILED' }
```

**`src/utils/dataAssertion.ts`** (create if missing):
```ts
export function dataAssertion<T>(response: GenericResponse<T>): T {
  if (response.type === 'error') throw new Error(response.message)
  return response.data
}
```

### Day 4–5: Root layout + dashboard shell setup

**`src/app/layout.tsx`** — wrap with `MantineProvider` (Dev B provides theme object):
```tsx
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
// theme from src/lib/theme.ts (Dev B creates)
```

**`src/app/(dashboard)/layout.tsx`** — `DashboardShell`:
- Check session server-side; redirect to login if missing
- Render `AppShell` (Mantine, from Dev B)

**Root redirect** `src/app/page.tsx`:
```ts
import { redirect } from 'next/navigation'
export default function Home() { redirect('/marketplace') }
```

---

## Dev B — Mantine Migration · Theme · Core UI Components

### Day 1: Install + uninstall

**Install:**
```bash
pnpm add @mantine/core @mantine/hooks @mantine/notifications @mantine/form @mantine/dates @mantine/carousel @mantine/charts
pnpm add @phosphor-icons/react framer-motion
pnpm add @mantine/core/styles.css  # PostCSS setup
```

**Remove:**
```bash
pnpm remove lucide-react @radix-ui/react-* class-variance-authority cmdk vaul
# Remove all src/components/ui/shadcn files (accordion, alert-dialog, badge, button, card, etc.)
```

**PostCSS config** for Mantine (add to `postcss.config.mjs`):
```js
import mantinePreset from 'postcss-preset-mantine'
import simpleVars from 'postcss-simple-vars'
export default { plugins: [mantinePreset(), simpleVars({ variables: { 'mantine-breakpoint-xs': '36em', ... } })] }
```

### Day 1–2: Theme

**`src/lib/theme.ts`** — ECSATrail brand theme:
```ts
import { createTheme, MantineColorsTuple } from '@mantine/core'
const ecsa: MantineColorsTuple = ['#e7f5ff', '#d0ebff', '#a5d8ff', '#74c0fc', '#4dabf7', '#339af0', '#228be6', '#1c7ed6', '#1971c2', '#1864ab']
export const theme = createTheme({
  primaryColor: 'ecsa',
  colors: { ecsa },
  defaultRadius: 'md',
  fontFamily: 'Inter, sans-serif',
  // brand: Primary #228BE6 · Highlight #FAB005 · Background #F8F9FA
})
```

### Day 2–3: Core layout components

**`src/components/layouts/AppShell.tsx`** — Mantine `AppShell`:
- Sidebar navigation (Mantine `NavLink`) for dashboard routes
- Mobile: burger menu → drawer
- Props: `children`, `activePath`

**`src/components/layouts/NavBar.tsx`** — inside AppShell:
- Logo + nav links: Chat, My Plans, Itinerary, Create, Marketplace, Subscription, Settings
- User avatar + signout (Mantine `Menu`)
- Language toggle (EN/VI)

**`src/components/ui/NavigationProgress.tsx`** — Mantine `nprogress`:
```ts
import { NavigationProgress, startNavigationProgress } from '@mantine/nprogress'
export { NavigationProgress, startNavigationProgress }
```

**`src/components/ui/ResponsiveLink.tsx`** — wrapper around Next `Link` with Mantine:
```tsx
// Polymorphic: can be used as component prop on Mantine components
export const ResponsiveLink = forwardRef<HTMLAnchorElement, ...>(({ href, children, ...props }, ref) => (
  <Link href={href} ref={ref} {...props}>{children}</Link>
))
```

### Day 3–4: Shared UI primitives (Mantine wrappers/helpers)

**`src/components/ui/ThemeProvider.tsx`** — client component wrapping `MantineProvider`:
```tsx
'use client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { theme } from '@/lib/theme'
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <MantineProvider theme={theme}>{children}<Notifications /></MantineProvider>
}
```

**`src/components/icons/AI.tsx`** — composite AI icon component:
```tsx
// Wraps any icon with a sparkle overlay for AI-powered actions
export function AI({ icon, sparkleSize = 10 }: { icon: React.ReactNode; sparkleSize?: number }) { ... }
```

**`src/components/ai/ECSATrailLogo.tsx`** — update to use Framer Motion + brand gradient:
- `thinking` prop triggers pulsing gradient animation `#7048E8 → #228BE6`

### Day 4–5: Migrate existing route pages to Mantine shell

**Migrate these pages to use Mantine layout (content still mock — Dev B does UI shell only):**
- `src/app/(public)/marketplace/page.tsx` — renders `<Marketplace />` inside public layout
- `src/app/(dashboard)/dashboard/create/page.tsx` — `DashboardShell` + `<CreatorStudio />`
- `src/app/(dashboard)/dashboard/my-plans/page.tsx` — `DashboardShell` + skeleton
- `src/app/(dashboard)/dashboard/itinerary/page.tsx` — `DashboardShell` + skeleton
- Add `loading.tsx` skeletons for each dashboard route (Mantine `Skeleton`)

**`src/components/ui/LanguageContext.tsx`** — keep as-is, just update import paths.

**`src/components/ui/UserContext.tsx`** — gut the wallet mock, keep interface, wire to server actions later (Sprint 2). For now keep mock so app doesn't break.

---

## Sprint 1 Definition of Done

- [ ] `npx.cmd tsc --noEmit` passes with 0 errors
- [ ] `pnpm lint` passes
- [ ] App runs at `localhost:3000` with Mantine UI (no shadcn components visible)
- [ ] `/login` page loads, Supabase auth credentials accepted
- [ ] Google OAuth redirect works (callback route)
- [ ] Authenticated user sees dashboard shell; unauthenticated user redirected to `/login`
- [ ] No lucide-react or radix imports anywhere in `src/`
- [ ] All source files under `src/`

## Stretch Goals

- `src/app/(dashboard)/dashboard/settings/page.tsx` skeleton
- Dark mode toggle wired to Mantine `ColorSchemeScript`
- Supabase `profile` row verified created after signup (check DB directly)