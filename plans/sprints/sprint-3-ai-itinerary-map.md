# Sprint 3 — AI Chat · Itinerary · Map

**Week:** 3  
**Goal:** Real Gemini AI chat generates itineraries that persist to the database. Itinerary route shows a real trip's stops on an interactive Google Map with two-way binding. Vercel AI SDK fully removed.  
**Prerequisite:** Sprint 2 complete — `place` table seeded, plans/stops in DB, auth working.

---

## Dev A — Gemini Runtime · AI Tools · Chat Persistence

### Day 1: Switch to @google/genai — remove Vercel AI SDK

```bash
pnpm remove ai @ai-sdk/react @ai-sdk/google
pnpm add @google/genai
```

**`src/lib/ai/client.ts`**:
```ts
import { GoogleGenAI } from '@google/genai'
export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export type AiTask = 'chat' | 'itineraryGen' | 'vision' | 'replan'
export type AiUserTier = 'free' | 'premium'

export function resolveModel(task: AiTask, tier: AiUserTier): string {
  // Read from src/data/models.ts — NEVER hardcode here
  return MODELS[task][tier]
}
```

**`src/data/models.ts`** — single source of truth for model strings:
```ts
export const MODELS: Record<AiTask, Record<AiUserTier, string>> = {
  chat:         { free: 'gemini-2.0-flash', premium: 'gemini-2.0-flash' },
  itineraryGen: { free: 'gemini-2.0-flash', premium: 'gemini-2.5-pro'  },
  vision:       { free: 'gemini-2.0-flash', premium: 'gemini-2.0-flash' },
  replan:       { free: 'gemini-2.0-flash', premium: 'gemini-2.5-pro'  },
}
```
After any edit, run `pnpm gen:models` to sync `supabase/functions/_shared/models.ts`.

### Day 1–2: AI tools

**`src/schemas/ai/tools.ts`** — Zod schemas for Gemini function declarations:
```ts
export const SearchPlacesInput = z.object({
  province: z.string().describe('Vietnamese province name'),
  category: z.enum(['temple','nature','beach','museum','food','market','cave']).optional(),
  limit: z.number().int().min(1).max(10).default(5),
})
export const CalculateDistanceInput = z.object({
  fromPlaceId: z.string(),
  toPlaceId: z.string(),
})
export const CheckWeatherInput = z.object({
  province: z.string(),
  date: z.string().describe('ISO date YYYY-MM-DD'),
})
export const RenderItineraryInput = z.object({
  title: z.string(),
  days: z.number().int(),
  stops: z.array(z.object({
    placeId: z.string(),
    stopOrder: z.number().int(),
    travelTimeMin: z.number().int(),
    transportMode: z.enum(['walk','taxi','motorbike','bus']),
    notes: z.string().optional(),
  })),
})
```

**`src/lib/ai/_convert.ts`** — `zodToGeminiSchema()`:
```ts
import { z } from 'zod'
import type { FunctionDeclaration } from '@google/genai'
export function zodToGeminiSchema(name: string, description: string, schema: z.ZodObject<any>): FunctionDeclaration {
  // Convert Zod schema → Gemini FunctionDeclaration JSON Schema
}
```

**`src/lib/ai/tools/searchPlaces.ts`**:
```ts
export async function searchPlaces({ province, category, limit }: z.infer<typeof SearchPlacesInput>) {
  const supabase = await createAdminClient()  // 'use cache' fn
  const q = supabase.from('place').select('*').eq('province', province).eq('source_verified', true)
  if (category) q.eq('category', category)
  const { data } = await q.limit(limit).order('credibility_score', { ascending: false })
  return data ?? []
}
```

**`src/lib/ai/tools/calculateDistance.ts`**:
```ts
// Haversine formula using lat/lng from place table
export async function calculateDistance({ fromPlaceId, toPlaceId }) { ... }
```

**`src/lib/ai/tools/checkWeather.ts`** (OpenWeatherMap stub for now — real key Sprint 4):
```ts
export async function checkWeather({ province, date }) {
  if (!process.env.OPENWEATHERMAP_API_KEY) return { status: 'unknown', note: 'weather key not configured' }
  // fetch OpenWeatherMap forecast API
}
```

### Day 2–3: AI runtime orchestrator

**`src/lib/ai/prompts/createPlan.ts`**, **`modifyPlan.ts`**, **`gapFill.ts`**, **`polishPlan.ts`**:
```ts
export function buildCreatePlanPrompt(userMessage: string, landmarks: string[], language: 'en' | 'vi'): string {
  return `You are ECSATrail AI, a Vietnam travel planning assistant...
  Available verified landmarks: ${landmarks.join(', ')}
  User request: ${userMessage}
  Use searchPlaces tool to find appropriate stops. Use renderItinerary tool to output the structured itinerary.
  Respond in ${language === 'vi' ? 'Vietnamese' : 'English'}.`
}
```

**`src/lib/ai/runtime.ts`** — multi-turn orchestrator with streaming:
```ts
export async function* runAiStream(params: {
  sessionId: string
  userMessage: string
  history: ChatMessage[]
  task: AiTask
  tier: AiUserTier
  language: 'en' | 'vi'
}): AsyncGenerator<AiStreamEvent> {
  const model = resolveModel(params.task, params.tier)
  const chat = genai.chats.create({
    model,
    config: { systemInstruction: buildPrompt(params.task, params.language) },
    history: params.history.map(toGeminiMessage),
  })

  const stream = await chat.sendMessageStream({ message: params.userMessage })

  for await (const chunk of stream) {
    const text = chunk.text()
    if (text) yield { type: 'text', text }

    for (const call of chunk.functionCalls() ?? []) {
      yield { type: 'tool_call', name: call.name, input: call.args }
      const result = await dispatchTool(call.name, call.args)
      yield { type: 'tool_result', name: call.name, output: result }
      // feed result back to model (continue stream)
    }
  }
}

async function dispatchTool(name: string, args: unknown) {
  switch (name) {
    case 'searchPlaces':     return searchPlaces(args as any)
    case 'calculateDistance': return calculateDistance(args as any)
    case 'checkWeather':     return checkWeather(args as any)
    case 'renderItinerary':  return args  // pass-through — frontend renders
    default: throw new Error(`Unknown tool: ${name}`)
  }
}
```

**PII redaction** `src/lib/ai/redact.ts`:
```ts
const PII_PATTERNS = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,  // credit card
  /\b(0|\+84)[0-9]{8,10}\b/g,                        // VN phone
  /\b\d{9}|\d{12}\b/g,                               // VN ID card
]
export function redactPII(text: string): string {
  return PII_PATTERNS.reduce((t, re) => t.replace(re, '[REDACTED]'), text)
}
```

### Day 3–4: Chat API route (Gemini streaming)

**Replace `src/app/api/chat/route.ts`** — remove Vercel AI SDK, use Gemini runtime:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { runAiStream } from '@/lib/ai/runtime'
import { redactPII } from '@/lib/ai/redact'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, sessionId, landmarks, locationContext } = await req.json()
  const userMessage = redactPII(messages.at(-1)?.content ?? '')

  // Determine tier
  const { data: sub } = await supabase.from('ai_subscription')
    .select('status').eq('user_id', user.id).eq('status', 'active').maybeSingle()
  const tier: AiUserTier = sub ? 'premium' : 'free'

  // Stream response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of runAiStream({ sessionId, userMessage, history: messages.slice(0,-1), task: 'chat', tier, language: 'en' })) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      controller.close()
    }
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}
```

### Day 4–5: Chat + itinerary persistence Server Actions

**`src/services/chat/createSession.ts`**, **`addMessage.ts`**, **`getSession.ts`**, **`getSessions.ts`**:
```ts
// createSession: insert chat_session, tag usr_${userId}_msg
// addMessage: insert chat_message (role, content, tool_name, tool_input, tool_output)
// getSession: fetch session + messages, cached usr_${userId}_msg
```

**`src/services/itinerary/saveGeneratedItinerary.ts`**:
```ts
// Called when renderItinerary tool fires during AI stream
// Creates purchased_plan (if not exists) + stop rows from AI output
// Returns purchasedPlanId to redirect user to /dashboard/itinerary/[id]
```

---

## Dev B — Map · Itinerary UI · Zustand · Stream Renderer

### Day 1: Google Maps setup + Zustand

```bash
pnpm add @react-google-maps/api zustand
```

**`src/lib/hooks/useItineraryFocus.ts`** — Zustand slice:
```ts
import { create } from 'zustand'
interface ItineraryFocusState {
  focusedStopId: string | null
  setFocusedStop: (id: string | null) => void
}
export const useItineraryFocus = create<ItineraryFocusState>((set) => ({
  focusedStopId: null,
  setFocusedStop: (id) => set({ focusedStopId: id }),
}))
```

**`src/components/maps/MapView.tsx`** — replace mock with real Google Maps:
```tsx
'use client'
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api'
import { useItineraryFocus } from '@/lib/hooks/useItineraryFocus'

// Props: stops (array with lat/lng from place), onMarkerClick
// On marker click: setFocusedStop(stopId)
// Subscribe focusedStopId: pan/zoom map to focused marker
```

**`src/components/maps/MapMarker.tsx`** — custom marker with stop order badge.  
**`src/components/maps/RouteLayer.tsx`** — polyline connecting stops in order.

### Day 2–3: Itinerary route (PPR pattern)

```
src/app/(dashboard)/dashboard/itinerary/[purchasedPlanId]/
├── page.tsx                       ← Server Component
├── ItineraryPageShell.tsx         ← Client Component
└── loading.tsx
src/components/sections/itinerary/
├── ItineraryWrapper.tsx           ← Server Component, fetches purchased stops
├── PlannerLayout.tsx              ← Client Component, splits map + timeline
├── ItineraryTimeline.tsx          ← Client Component (real data, remove mock)
└── WeatherAlertBanner.tsx         ← New — shows active weather_alert
```

**`src/services/itinerary/getPurchasedPlan.ts`**:
```ts
// Fetch purchased_plan + stop JOIN place for all stops
// Cache: usr_${userId}_pln, cacheLife('minutes')
// Include active trip's weather_alert if any
```

**`PlannerLayout.tsx`** — split-panel layout:
```tsx
// Left: MapView (50%) — receives stops with place lat/lng
// Right: ItineraryTimeline (50%) — scrollable
// Responsive: stacked on mobile (tabs: Map / Timeline)
// Both subscribe to useItineraryFocus
```

**`ItineraryTimeline.tsx`** — replace VIETNAM_LANDMARKS + PLAN_B_SUBS mocks:
- Receive `stops: PurchasedStop[]` prop (real data from server)
- Subscribe `useItineraryFocus`: when `focusedStopId` changes, scroll that card into view
- On card click: `setFocusedStop(stop.id)` → map pans
- Plan A/B toggle connected to real `trip.active_plan` field (update via Server Action Sprint 4)
- Weather alert UI: render `WeatherAlertBanner` from real `weather_alert` row

### Day 3–4: Chat panel → Gemini streaming

**`src/components/sections/chat/ChatPanel.tsx`** — replace `useChat` (Vercel) with custom SSE hook:

**`src/hooks/useGeminiChat.ts`**:
```ts
export function useGeminiChat(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle')

  async function sendMessage(text: string) {
    setStatus('streaming')
    setMessages(prev => [...prev, { role: 'user', content: text, id: crypto.randomUUID() }])

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [...messages, { role: 'user', content: text }], sessionId }),
      headers: { 'Content-Type': 'application/json' },
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let assistantText = ''
    const assistantId = crypto.randomUUID()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const event: AiStreamEvent = JSON.parse(line.slice(6))
        if (event.type === 'text') {
          assistantText += event.text
          setMessages(prev => {
            const last = prev.at(-1)
            if (last?.id === assistantId) return [...prev.slice(0,-1), { ...last, content: assistantText }]
            return [...prev, { role: 'assistant', content: assistantText, id: assistantId }]
          })
        }
        if (event.type === 'tool_result' && event.name === 'renderItinerary') {
          onItineraryGenerated?.(event.output)
        }
      }
    }
    setStatus('idle')
  }

  return { messages, sendMessage, status }
}
```

**Update `ChatPanel.tsx`**:
- Replace `useChat` with `useGeminiChat`
- ECSATrailLogo `thinking` prop → `status === 'streaming'`
- Persist session: on first message, call `createSession`, pass `sessionId` to subsequent calls

### Day 4–5: Stream Renderer + AI itinerary output

**`src/components/ai/StreamRenderer.tsx`**:
```tsx
// Receives AiStreamEvent[] — switches on type:
// 'text' → renders markdown in chat bubble
// 'tool_call' → shows "Searching places…" spinner
// 'tool_result' (renderItinerary) → renders ItineraryPreviewCard inline
```

**`src/components/ai/ItineraryPreviewCard.tsx`**:
- Compact timeline preview of AI-generated stops
- "Save to My Plans" button → calls `saveGeneratedItinerary`
- After save: "Open full itinerary →" link to `/dashboard/itinerary/[id]`

---

## Sprint 3 Definition of Done

- [ ] Chat sends real messages to Gemini 2.0 Flash; streams response token by token
- [ ] No Vercel AI SDK imports anywhere (`ai`, `@ai-sdk/*` fully removed)
- [ ] `searchPlaces` tool call fires when AI needs landmarks; returns real DB places
- [ ] `renderItinerary` tool output renders inline in chat as structured card
- [ ] Chat session + messages persisted to `chat_session` + `chat_message` tables
- [ ] Itinerary route loads real stops for a purchased plan
- [ ] Map shows stop markers; clicking marker scrolls timeline; clicking card pans map
- [ ] PII redaction applied to all user input before Gemini receives it
- [ ] `pnpm build` passes

## Stretch Goals

- `addToCalendar` tool (premium-gated stub — throws `AI_PREMIUM_REQUIRED` if no sub)
- `exportItinerary` tool stub
- Chat session history list (sidebar showing previous sessions)
- Voice input (Web Speech API) in ChatPanel
