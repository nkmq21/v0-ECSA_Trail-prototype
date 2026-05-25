# ECSATrail — 6-Week Sprint Overview

**Team:** 2 full-stack devs (Dev A, Dev B)  
**Timeline:** 6 × 1-week sprints  
**Payment:** SePay (Vietnamese gateway, replaces Stripe)  
**UI target:** Mantine v9 + Phosphor Icons (migration from shadcn/lucide)

---

## Sprint Summary

| Sprint | Theme | Dev A focus | Dev B focus | Deliverable |
|--------|-------|-------------|-------------|-------------|
| 1 | Foundation | `src/` restructure · Supabase Auth · API key setup | Mantine v9 migration · theme · AppShell | App boots with real login, Mantine UI |
| 2 | Marketplace + Creator | Backend: Server Actions, RPCs, place seed | Frontend: Marketplace, Creator Studio, My-Plans real data | Creator can publish plan; consumer can browse + buy |
| 3 | AI + Itinerary + Map | Gemini runtime, AI tools, chat persistence | Map (Google Maps), itinerary UI, Zustand binding | Real AI chat generates + saves itinerary |
| 4 | Trip + Weather | trip-poller EF, weather tool, push notifications | Trip UI, Plan A/B switch, alert modals | Trips start; weather alert fires; Plan B accepted |
| 5 | SePay + Gamification | SePay API, AI subscription, place ingest EF | Gamification UI, subscription page, voucher store | Users pay for AI tier; earn XP + redeem vouchers |
| 6 | PWA + Polish | PWA/SW, public routes, security audit | Settings, loading states, responsive, Framer polish | Lighthouse PWA pass; production-ready |

---

## Key Decisions Baked In

- **No Stripe** — SePay QR/bank-transfer flow. Webhook handler at `src/app/api/payment/webhook/route.ts`.
- **`src/` structure** — All files live under `src/`. tsconfig `@/*` → `src/*`. Sprint 1 restructures this first.
- **Mantine v9** over shadcn. All radix/shadcn components removed Sprint 1. No `@mantine/modals` — local `<Modal>` only.
- **@google/genai** — Vercel AI SDK removed Sprint 3. Chat route rewired to Gemini streaming.
- **Cursor pagination everywhere** — no offset. `src/utils/cursor.ts` (encodeCursor/decodeCursor) Sprint 2.
- **PPR pattern** — every dashboard route = page.tsx → Shell.tsx → TableWrapper.tsx → Table.tsx.
- **Split-function caching** — public (not cached) → cached path → shared fetcher.

---

## Dependency Map

```
Sprint 1 (auth + Mantine)
  └── Sprint 2 (real data — needs auth userId, Mantine components)
        ├── Sprint 3 (AI chat — needs plan/stop data, place table seeded)
        │     └── Sprint 4 (trip — needs itinerary, AI for Plan B)
        │           └── Sprint 5 (SePay — needs trip, subscription status)
        │                 └── Sprint 6 (PWA — needs all features stable)
        └── Sprint 5 (gamification — needs purchased_plan, stop, place data)
```

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Mantine migration bigger than 1 week | Both devs in Sprint 1; shadcn components progressively deleted, not big-bang |
| SePay API docs sparse | Research + sandbox setup start of Sprint 5; mock webhook in Sprint 2 |
| Google Maps billing delay | Use static mock tiles in Sprint 3 until key active; unblock map UI |
| Gemini API quota limits | Set low per-user rate limit server-side from day 1 |
| trip-poller EF too complex | Ship basic version (just weather check + alert insert) Sprint 4; AI Plan B synthesis Sprint 4 stretch |
| Gamification scope creep | Core loop (EXP + badge) Sprint 5; voucher redemption Sprint 5 stretch |
