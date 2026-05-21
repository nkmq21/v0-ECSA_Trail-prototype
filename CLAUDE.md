# CLAUDE.md

File guide Claude Code (claude.ai/code) for work in repo.

## Project Overview

**ECSATrail** = AI-driven travel planner PWA (Vietnam-first). Platform connects **Plan Creators** (experienced travelers who author itineraries) with **Plan Consumers** (browse, own, customize plans), plus a lightweight **Business/Affiliate API** surface. Monetization is **AI premium subscription only** (per-plan or monthly) — creator plans are free to consumers, **no platform fee** on creator listings. Next.js 16 App Router, React 19, Mantine UI v9, Supabase. Server-side sessions, `GenericResponse` pattern, React Compiler opt, PPR (Partial Pre-Rendering), offline-first via Service Worker.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Check API keys + Next.js build
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check
npm run gen:types    # Regenerate database.types.ts from Supabase and Zod schemas
npm run gen:models   # Regenerate supabase/functions/_shared/models.ts from src/data/models.ts
npm run ef           # Deploy Edge Functions to Supabase (npm run ef -- function-a function-b)
```

**TypeScript check (use `npx.cmd` on Windows):**
```bash
npx.cmd tsc --noEmit
```

> **IMPORTANT:** Always use `npx.cmd` instead of `npx` for all npx calls in this environment.

## Architecture

### Route Structure
```
src/app/
├── (public)/           # Public routes
│   ├── marketplace/    # Browse community-posted plans (free)
│   ├── plan/[id]/      # Public plan preview (AI features gated)
│   └── (auth)/         # Login, signup (Supabase Auth + Google OAuth)
├── (dashboard)/        # Protected routes — wrapped by DashboardShell
│   └── dashboard/
│       ├── chat/          # AI Planner conversational interface
│       ├── itinerary/     # Active trip timeline + map (two-way binding)
│       ├── my-plans/      # Owned + saved plans (no purchase — plans are free)
│       ├── create/        # Creator Studio — plan authoring + AI polish
│       ├── subscription/  # AI premium tier management
│       └── settings/      # Profile, privacy, push notifications
└── api/                   # Auth callbacks, OAuth, Stripe webhooks, Business API only
```

### Supabase Clients
Three clients — pick right one per context:
- `createClient()` from `src/utils/supabase/server.ts` — Server Components, Server Actions, Route Handlers, anything server-side except caching.
- `createAdminClient()` from `src/utils/supabase/admin.ts` — `'use cache'` functions (bypass RLS/cookies). DO NOT use outside caching.
- `createClientClient()` from `src/utils/supabase/client.ts` — Browser, `useUser` hook, Realtime subs

> **Always `await createClient()`** — async in Next.js 16+.

### GenericResponse & dataAssertion Pattern
All service responses return `GenericResponse<T>`:
```typescript
interface GenericResponse<T = never> {
    data: T;
    code: AppErrorCodes | AppSuccessCodes | AppInfoCodes;
    type: 'success' | 'error' | 'info' | 'warning';
    message?: string;
}
```
UI flow: service → `showNotificationFromAssertion()` for Mantine notifs (or `dataAssertion(response)` from `src/utils/dataAssertion.ts` if extra conditional checks needed + no notifs). Human messages in `src/libs/errors.ts`.

### Server Actions (`withServerAction` wrapper)
All server actions in `src/services/*` use `withServerAction`:
```typescript
'use server';
import createClient from '@/utils/supabase/server';
import {withServerAction} from "@/utils/actionWrapper";

export const myAction = withServerAction(EntityActionSchema, async (params, {userId}) => {
    const supabase = await createClient();
    const {data, error} = await supabase.from('table').insert(params).select().single();
    if (error) throw error;
    return {data, code: AppSuccessCodes.CREATED, type: 'success'};
});
```
- Handles Zod validation, error parse, user auth via `verifyUser()`
- No try-catch — throw, wrapper handles
- API routes **only** for third-party callbacks + Business API; all internal mutations = Server Actions

> ECSATrail is B2C single-user per account (no org/tenant model). `withServerAction` injects `userId` only — no `tenantId`. Cache tags scope by `userId` for owned data; global tags for shared data (verified places, public marketplace listings).

### PPR / Page Pattern
Each dashboard route = three-layer (see `my-plans/` canonical):
```
src/app/(dashboard)/dashboard/[route]/
├── page.tsx              # Server Component — renders shell with Suspense child
├── [Route]PageShell.tsx  # Client Component — wraps TableWrapper in Suspense
└── loading.tsx           # Skeleton shown during navigation

src/components/sections/[route]/
├── [Route]TableWrapper.tsx  # Server Component — fetches data
└── [Route]Table.tsx         # Client Component — state & interactivity
```

### Cursor-Based Pagination
**Never offset pagination.** All list queries cursor-based:
- Cursor = base64-encoded `{ sortValue, id }` tuple (`encodeCursor`/`decodeCursor` from `src/utils/cursor.ts`)
- Sort by `(sortBy, PK)`, fetch `limit + 1` to detect `hasMore`
- Response: `CursorXxxResponse` with `{ items, total, nextCursor, hasMore }`
- Frontend: `useInfiniteScroll` hook (`src/hooks/useInfiniteScroll.ts`) — seed by Server Component, next batches via Server Action
- **Always dedupe by PK** in `loadMore` using `Map` for stale-first-batch edge

### Caching Strategy (Split Function Pattern)
List queries split three functions to keep `'use cache'` safe:
```typescript
// 1. Public entry — NOT cached, routes search vs. stable filters
export const getPlans = withServerAction(..., async (params, {userId}) => {
    if (search?.trim()) return fetchPlans(userId, {...});  // bypass cache
    return getPlansCached(userId, cursor, limit, stableFilters);
});

// 2. Cached path — stable filters only, never search
async function getPlansCached(...) {
    'use cache';
    cacheLife('minutes');
    cacheTag(`usr_${userId}_pln`);
    return fetchPlans(...);
}

// 3. Shared query builder — used by both paths
async function fetchPlans(...) { /* Supabase query */ }
```
All mutations must call `updateTag(`<scope>_<type>`)`.

**Cache lifetimes** (in `next.config.ts`): `'minutes'` (5 min), `'hours'` (1 hr), `'days'` (1 day).

**Cache tag structure:** Two scopes:
- **User-scoped:** `usr_${userId}` + suffix — for owned data
- **Global (no prefix):** for shared/public data (verified places, marketplace listings, creator profiles)

**Suffixes:**
- `_pln` (plan / itinerary)
- `_trp` (active trip — monitored by re-planning poller)
- `_msg` (chat conversation)
- `_pls` (place — verified location, global)
- `_mkt` (marketplace listing, global)
- `_rvw` (review / rating)
- `_crt` (creator profile, global)
- `_aip` (AI premium subscription status)
- `_sav` (saved/bookmarked plans)
- `_usr_all` (all users, admin)

**Scoped variants:** `_pln_crt_${creatorId}` (plans by a creator), `_pln_loc_${provinceCode}` (plans by province), `_rvw_pln_${planId}` (reviews for a plan), `_trp_act` (all active trips — used only by EF poller), `_pls_loc_${provinceCode}` (places in a province).

### Other Key Patterns
- **Route Navigation:** Use `ResponsiveLink` from `src/components/ui/ResponsiveLink.tsx` for all internal links, or change component type to use `ResponsiveLink` (common for Mantine components with `component` override). Wraps Next.js `Link`, handles responsive. Never `next/link` or `window.location` direct. If `router.push()` or `useRouter()` used, put `startNavigationProgress()` from `src/components/ui/NavigationProgress.tsx` in same handler right before router use to trigger progress bar.
```ts
export function PlanCard({plan}: PlanCardProps) {
    const router = useRouter();
    // ...

    const handleClick = () => {
        startNavigationProgress();
        router.push(`/dashboard/itinerary/${plan.plan_id}`);
    };

    // ...
}
```
- Use `AI` composite icon in `src/components/icons/AI.tsx` for any actions involving AI inside non-AI routes (e.g. "AI Re-plan", "AI Polish", "AI Gap-fill" buttons inside `create/` or `itinerary/`). Only use `SparkleIcon` to represent AI if the feature itself *is* AI (e.g. `/dashboard/chat` route header), never for AI-powered actions within non-AI routes.
```ts
{/* Additionally wrap `AI` in `ActionIcon` if preferred */}
<ActionIcon
    variant={aiPolish ? 'light' : 'subtle'}
    color={aiPolish ? 'violet' : 'gray'}
    size="sm"
    onClick={() => onAiPolishChange(!aiPolish)}
>
    <AI icon={<MagicWandIcon size={16} />} sparkleSize={10} />
</ActionIcon>
```
- **Map ↔ Itinerary two-way binding (SRS §4.1):** Clicking a map marker scrolls the corresponding itinerary card into view; clicking a card centers + zooms the map. Use a single Zustand slice (`useItineraryFocus` in `src/lib/hooks/useItineraryFocus.ts`) holding `focusedStopId` — both `PlanMap` and `ItineraryList` subscribe + dispatch. Do **not** pass refs/callbacks down two component trees.
- **PWA / Offline (SRS §3.1, §4.1):** Plans the user has opened at least once must remain readable offline (service worker stores plan JSON + `place` snapshots). Map tiles for the active trip's bounding box pre-cached on plan open. Re-planning alerts arrive via Web Push from the EF poller — never via in-app polling/setInterval. Manifest must pass Lighthouse PWA checks (maskable icons, valid `manifest.json`, registered SW).

## Component Organization
```
src/components/
├── ai/         # ChatBubble, TypingIndicator, StreamRenderer, ThinkingIndicator (pulsing ECSATrail logo for masking AI latency)
├── maps/       # PlanMap, MapMarker, RouteLayer, ProvinceSelector
├── layouts/    # Page shells, navbars, headers
├── sections/   # Feature sections co-located by route (chat/, itinerary/, my-plans/, create/, marketplace/, etc.)
├── skeletons/  # Loading state components
└── ui/         # Reusable primitives (buttons, drawers, ResponsiveLink, NavigationProgress, AI icon, etc.)
```
- Every component co-located `.module.css`
- Larger page-level wrappers live with route in `src/app/(dashboard)/dashboard/[route]/`

## Type Safety & Schemas
- `src/types/database.types.ts` — Supabase-generated types (source of truth for DB schema)
- `src/types/actors/*.ts` — Custom types with joined relations (e.g. `PlanDetails`, `TripDetails`, `CreatorDetails`, `PlaceDetails`)
- `src/types/DTOs.ts` — Data Transfer Objects (incl. AI tool I/O shapes streamed to the client)
- `src/schemas/generated/index.ts` — Auto-gen base Zod schemas (from `gen:schemas`)
- `src/schemas/*.ts` — Extended schemas with stricter validation, `.pick()`/`.omit()` for mutations
- `src/schemas/ai/tools.ts` — Zod schemas for Gemini function-call declarations (the registry the model sees — single source of truth for tool I/O)

## Security: API Keys & Secrets

### Never pass secret keys over HTTP
- **Service role key (`SUPABASE_SERVICE_ROLE_KEY` / `SECRET_KEY`)** ONLY for `createClient()` / `createAdminClient()` in server-side code. NEVER in `Authorization` header, fetch call, or any network value.
- **For internal function-to-function calls** (Edge Function → Edge Function, Edge Function → Next.js API route): use **publishable key** (`PUBLISHABLE_KEY` in Edge Functions with `SUPABASE_ANON_KEY` as fallback, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Next.js). Safe to transmit — only grants RLS-scoped access.
- **Applies to ALL sensitive keys** (service role, OAuth client secrets, Gemini API key, Google Maps server key, OpenWeatherMap key, Stripe secret, VAPID push key). Privileged keys stay in `process.env` / `Deno.env`, used locally — never in headers/bodies.
- **Auth between internal services:** use publishable key as `apikey` header. Receiving endpoint validates against own copy.

### PII Redaction (SRS §6.2)
Middleware in `src/middleware/redact.ts` strips credit-card numbers, phone numbers, and Vietnamese ID-card patterns from chat input **before** forwarding to Gemini. Every call into `src/lib/ai/runtime.ts` must pass through `redactPII()` — wired in the runtime entry, not at call sites. Never bypass.

## AI Implementation (`@google/genai`)

ECSATrail uses Google's first-party GenAI SDK (`@google/genai`) — **not** Vercel AI SDK. Direct client = finer control over function-calling rounds, streaming chunks, and per-tier cost telemetry. All wrappers live in `src/lib/ai/`.

### Layout
```
src/lib/ai/
├── client.ts        # GoogleGenAI instance + per-tier model resolution
├── runtime.ts       # Multi-turn orchestrator: stream → tool call → resume
├── redact.ts        # Pre-flight PII scrub helper (wraps middleware)
├── tools/           # Function-call tool implementations (one file each)
│   ├── searchPlaces.ts
│   ├── calculateDistance.ts
│   ├── checkWeather.ts
│   ├── addToCalendar.ts     # Premium-gated
│   └── exportItinerary.ts   # Premium-gated
├── prompts/         # System prompts per intent (createPlan, modifyPlan, gapFill, polishPlan, replan)
└── _convert.ts      # zodToGeminiSchema() — turns Zod tool schemas into Gemini FunctionDeclaration
```

### Tool calling
- Tools defined as Zod schemas in `src/schemas/ai/tools.ts`, converted to Gemini `FunctionDeclaration` via `zodToGeminiSchema()`.
- **Tools never call other tools directly.** Each tool is a deterministic single-step server function. The orchestrator in `runtime.ts` decides chaining.
- **Premium-gated tools** (`addToCalendar`, `exportItinerary`, and the re-planning loop) check the caller's AI subscription status at the top of the handler and throw `AppErrorCodes.AI_PREMIUM_REQUIRED` if missing. The error surfaces to the model so it can respond gracefully ("you'll need Premium to export — here's what would be in the PDF…").
- **Generative UI:** Structured itinerary output is a tool call — `renderItineraryComponent({...})` — which the orchestrator pipes to the client over the same stream as a typed event. Frontend `StreamRenderer` switches on event type to render Timeline Cards / Map Markers inline alongside streamed prose.

### Model tier resolution
Free vs. Premium model selection lives entirely in `src/data/models.ts`. Never hard-code model strings in tool/prompt/route code — always go through `resolveModel(task, tier)`. Tasks: `chat`, `itineraryGen`, `vision`, `replan`.

### Autonomous Re-planning Poller (Edge Function)
The poller (`supabase/functions/trip-poller/`) runs on a 2–4hr cron (SRS §4.3), scans active trips (`_trp_act` tag), calls weather + traffic tools per stop, and if a material change is detected, asks Gemini to synthesize a "Plan B" diff. The diff + a Web Push notification go out via the user's subscribed `push_subscription`. The user accepts/rejects via in-app modal; only accepted diffs are persisted. **Privacy Policy must explicitly disclose this background processing** (SRS §6.3) — never enable for a user who has not opted in.

### Data Integrity — Common Denominator Rule (SRS §3.1)
Places are only trusted at **≥60–70% multi-source credibility**. Never write to `place` table from a single source. Ingestion goes through `supabase/functions/place-ingest/` which:
1. Pulls from Google Places API (primary)
2. Cross-references ≥1 scraped source (Facebook, blogs, etc.)
3. Runs a small prediction-model consistency check before allow-listing
4. Stores a `credibility_score` on `place`; queries surface this to the AI as tool output so the model can de-prioritize low-confidence stops.

When creators publish plans, every stop is RAG-verified against `place` — un-verified stops block publication.

## Key Conventions
- **Import placement:** Imports directly below `'use client'`/`'use server'`, no blank line between
- **Fields:** snake_case in DB, camelCase in TypeScript services
- **File naming:** PascalCase for components/types, camelCase for services/utils
- **Errors:** Use `parseSupabaseError()` to convert Supabase errors; never throw raw to UI
- **Notifications:** Use `showNotificationFromAssertion()` — never hand-build Mantine notifs
- **Modals:** ONLY use `Modal` from `@mantine/core` directly. **NEVER** use `@mantine/modals` (`ModalsProvider`, `modals.openConfirmModal`, `modals.openContextModal`, etc.). Build confirm dialogs as local `<Modal>` instances controlled by `useState`. Project intentionally does NOT mount `ModalsProvider` — manager-API calls silently no-op.
- **Search:** Never cache search queries — bypass to `fetchXxx` direct
- **Database table naming:** Singular (e.g., `plan`, not `plans`; `place`, not `places`; `trip`, not `trips`)
- **Type and schema re-generation:** Always run `gen:types` scripts in `package.json` scripts after migrations.
- **Gemini model registry:** `src/data/models.ts` is the single source of truth. EFs run on Deno and cannot import via Next.js path aliases, so `supabase/functions/_shared/models.ts` is a generated mirror. **After ANY edit to `src/data/models.ts`, run `npm run gen:models` and commit both files together.** Never hand-edit the EF mirror — it is overwritten by `scripts/gen-models.mjs`. Deprecated model versions removed from the registry must not be reintroduced — once retired, gone.
- **Edge Functions:** All in `src/edge-functions/`, deployed via `ef` script. Use for the trip poller, place-ingest pipeline, push delivery, and Stripe subscription webhook handling.
- **`any`/`unknown` Casts:** DO NOT cast these when writing code that waits for user's manual migration to database and type regeneration. Just write the code as if the new types are already in place. This prevents forgotten casts and reduces junk code.

## Claude Patterns
- DO NOT re-read code/files already read same conversation. Pull from YOUR context/memory.
- Frontend, UI work, scaffolds, detailed component impl → ALWAYS INVOKE right skills/plugins like `frontend-design` for production-grade output.
- Plans via `ralplan` or `omc-plan` → write to `.omc/plans` dir; SQL migrations → `supabase/migrations` with proper date format (e.g. `YYYYMMDD000000_migration_description.sql`).
- RLS policies using `auth.uid()` or RPCs/functions → always use `select` for optimal perf:
```sql
-- Instead of this:
create policy "rls_test_select" on test_table
    to authenticated
    using (auth.uid() = user_id);
-- Use this:
create policy "rls_test_select" on test_table
    to authenticated
    using ((select auth.uid()) = user_id);
```
- Explore DB structure via `src/types/database.types.ts`. Use Supabase MCP only when explicitly requested or the schema file is insufficient.
- **No Git operations.** All Git workflows manual. Never run `git` commands.
- **Prioritize `vercel-react-best-practices` skill** for all React + Next.js work. Authoritative for this stack (Next.js 16, React 19, RSC, App Router).
- **All patterns in this file final**, take precedence over global rules or skills.

## React 19 + React Compiler Patterns

Rules reflect React 19.2.0 + React Compiler (`reactCompiler: true`). Prevent re-intro of deprecated/redundant patterns.

### Banned Patterns
- **`forwardRef`** — Deprecated React 19. Pass `ref` as regular prop. Add `ref?: React.Ref<Handle>` to props interface. `useImperativeHandle` still works with ref prop.
- **`memo()`** — Redundant with React Compiler. Compiler auto-memoizes. Export as plain functions.
- **`useEffect` for derived state** — Never `useState` + `useEffect` to derive from props/other state. Compute during render. See `~/.claude/rules/react/STOP_USING_USEEFFECT.md`.

### Memoization Guidance
- **`useMemo`/`useCallback`** — Compiler auto-memoizes. Do NOT wrap trivial compute in `useMemo`. Do NOT wrap handlers in `useCallback`. Manual memo only for measured perf problems compiler can't solve.
- **Derive during render** — Simple compute (`filter`, `map`, `reduce`, `slice`, bool checks) = inline `const`, not `useMemo`.

### State Management
- **`useReducer` over `useState` sprawl** — 8+ `useState` + correlated transitions → consolidate to `useReducer`. Keep independent form inputs as `useState`. Reducer makes transitions atomic + self-documenting.
- **Immutable updates** — Reducer cases always return new objects/Sets/Maps, never mutate.
- **Zustand for cross-tree shared UI state** — Map ↔ Itinerary focus, chat draft, active-trip pointer. Local component state stays `useState`/`useReducer`.

### Mantine Form: Input Focus Loss Prevention (`NumberInput`, `TextInput`, etc.)
**Never override `onChange` from `getInputProps` to call `form.setFieldValue` manually** when using Mantine's uncontrolled form mode. The combination bumps the field key (`form.key('xxx')`) and remounts the input on every keystroke — drops focus + cursor position. This bug recurs every time inputs are wired with side-effects-on-change. STOP REINTRODUCING IT.

**For side effects on field change** (dispatching to a reducer, syncing to other state), use the form-level `onValuesChange` callback in `useForm` config:
```typescript
const form = useForm({
    mode: 'uncontrolled',
    initialValues: {...},
    onValuesChange: (values, prev) => {
        if (values.budget !== prev.budget && typeof values.budget === 'number') {
            tripDispatch({type: 'SET_BUDGET', budget: values.budget});
        }
    },
});
```

**NumberInput integration pattern** — spread getInputProps cleanly, no override:
```tsx
<NumberInput
    key={form.key('budget')}
    {...form.getInputProps('budget')}
    // No custom onChange. Side effects go in useForm({onValuesChange}).
/>
```

If a side effect requires the latest value reactively in JSX (e.g. conditionally rendering a sibling field), prefer a separate local `useState` mirror (sync via Select/etc onChange) over `form.watch` on a typing field — `form.watch` re-renders the parent on every keystroke and amplifies the focus-loss footprint.

## Key Dependencies
- **UI:** Mantine v9 (core, form, notifications, carousel, charts, dates)
- **Icons:** Phosphor Icons (main icon library) — must suffix the icon names with `Icon` to avoid using deprecated APIs (e.g. `MapPinIcon`, not `MapPin`).
- **Animation:** Framer Motion — page transitions, `LayoutGroup` for streaming chat bubbles (prevents layout jump), pulsing ECSATrail-logo "Thinking" indicator to mask AI latency.
- **Maps:** `@react-google-maps/api` — interactive map, markers, route layer, two-way binding with itinerary list via `useItineraryFocus` Zustand slice.
- **AI:** `@google/genai` (Google GenAI client for Gemini) — direct, no Vercel AI SDK wrapper. Function-calling orchestrated in `src/lib/ai/runtime.ts`.
- **Backend:** Supabase (auth, DB, realtime, Edge Functions). Google OAuth for sign-in.
- **State:** Zustand for cross-tree client UI state (Map/Itinerary focus, chat draft, active-trip pointer).
- **Voice input:** Web Speech API for chat dictation — no third-party dep.
- **PWA:** `next-pwa` for service-worker generation; `web-push` (Deno-compatible variant) in EFs for re-planning notifications.
- **Payments:** Stripe (AI premium subscription only — per-plan and monthly tiers). Creator plans are free; no marketplace transaction logic.
- **Brand colors (SRS §5.1):** Primary `#228BE6` · Highlight `#FAB005` · Background `#F8F9FA` · AI Thinking gradient `#7048E8 → #228BE6` (pulsing).
