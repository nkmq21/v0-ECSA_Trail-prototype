# Copilot instructions for ECSATrail

## Build, test, lint
- Build: `npm run build`
- Lint: `npm run lint`
- Tests: no test runner configured in `package.json` (no single-test command available).

## Architecture (big picture)
- Next.js 16 App Router with route groups in `app/(public)` and `app/(dashboard)`. Both share the `AppShell` layout (`components/layouts/AppShell`) and a common `NavBar`; the root route redirects to `/marketplace`.
- UI composition is layered: route pages are thin and render feature sections from `components/sections`, with shared UI in `components/ui`, layout primitives in `components/layouts`, AI UI in `components/ai`, and map UI in `components/maps`.
- AI chat backend lives in `app/api/chat/route.ts`, using the Vercel AI SDK (`ai`) with streaming and Zod tool schemas. Domain types and mock datasets used by AI and UI live in `lib/types.ts` and `lib/mock-data.ts`.
- Supabase integration uses helpers in `utils/supabase` (`createClient` for server, `createClientClient` for browser, `createAdminClient` for service role). Session refresh logic is defined in `utils/supabase/proxy.ts` and re-exported in the root `proxy.ts` with a matcher config for middleware-style auth.

## Key conventions
- Use the `@/*` path alias (from `tsconfig.json`) for imports across `app`, `components`, `lib`, and `utils`.
- Server-side Supabase calls should use the async `createClient()` helper; browser code uses `createClientClient()`, and privileged operations use `createAdminClient()` with `SUPABASE_SECRET_KEY`.
- Language strings live in `lib/translations.ts` and are accessed through `LanguageProvider`/`useLanguage` in `components/ui/LanguageContext`.
- Use `cn()` from `lib/utils` (clsx + tailwind-merge) for class name composition.
