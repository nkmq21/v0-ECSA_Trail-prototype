import { convertToModelMessages, streamText, UIMessage, tool } from 'ai'
import { z } from 'zod'
import { VIETNAM_LANDMARKS } from '@/lib/mock-data'

export const maxDuration = 30

const SYSTEM_PROMPT = `You are ECSATrail, an expert AI travel planner specializing in Vietnam. You help travelers discover authentic Vietnamese experiences using verified local data.

Your capabilities:
- Generate detailed, optimized travel itineraries for Vietnam
- Fill in "gaps" — automatically calculate travel times, transport modes, and optimal sequences between user-selected landmarks
- Suggest verified landmarks with credibility scores from the ECSATrail database
- Adapt plans based on weather alerts
- Provide cultural context and practical tips

Response format:
- For itinerary generation, return structured JSON with stops, travel times, and transport modes
- Always mention the credibility score when recommending specific landmarks
- Flag if a landmark has a "Source Verified" badge (appears in 3+ data sources)
- If weather is bad for outdoor activities, proactively suggest indoor alternatives

Current available verified landmarks (top picks):
${VIETNAM_LANDMARKS.slice(0, 5).map(l => `- ${l.nameEn} (${l.province}): ${l.description} — Credibility: ${l.credibilityScore}/100`).join('\n')}

Always respond in a helpful, culturally sensitive tone. Use Vietnamese place names alongside English names.`

export async function POST(req: Request) {
  const { messages, landmarks }: { messages: UIMessage[]; landmarks?: string[] } = await req.json()

  const result = streamText({
    model: 'google/gemini-2.0-flash',
    system: SYSTEM_PROMPT + (landmarks?.length
      ? `\n\nUser has selected these landmarks on the map: ${landmarks.join(', ')}. Use these as the primary stops.`
      : ''),
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
    tools: {
      generateItinerary: tool({
        description: 'Generate a structured travel itinerary with stops, travel times, and transport modes',
        inputSchema: z.object({
          title: z.string().describe('Itinerary title'),
          days: z.number().describe('Number of days'),
          stops: z.array(z.object({
            landmarkId: z.string().describe('Landmark ID from the database'),
            landmarkName: z.string().describe('Name of the landmark'),
            order: z.number(),
            travelTime: z.number().describe('Minutes from previous stop'),
            transportMode: z.enum(['walk', 'taxi', 'motorbike', 'bus']),
            notes: z.string().describe('Tips for this stop'),
          })),
        }),
        execute: async (input) => {
          return {
            success: true,
            itinerary: input,
            message: `Generated itinerary: ${input.title} (${input.days} days, ${input.stops.length} stops)`,
          }
        },
      }),
      searchLandmarks: tool({
        description: 'Search for landmarks in a specific province or category',
        inputSchema: z.object({
          province: z.string().nullable().describe('Vietnamese province name'),
          category: z.enum(['temple', 'nature', 'beach', 'museum', 'food', 'market', 'cave']).nullable(),
          minCredibility: z.number().nullable().describe('Minimum credibility score (0-100)'),
        }),
        execute: async ({ province, category, minCredibility }) => {
          let results = VIETNAM_LANDMARKS
          if (province) results = results.filter(l => l.province.toLowerCase().includes(province.toLowerCase()))
          if (category) results = results.filter(l => l.category === category)
          if (minCredibility) results = results.filter(l => l.credibilityScore >= minCredibility)
          return {
            landmarks: results.map(l => ({
              id: l.id,
              name: l.nameEn,
              nameVi: l.name,
              province: l.province,
              credibilityScore: l.credibilityScore,
              sourceVerified: l.sourceVerified,
              sources: l.sources,
              duration: l.duration,
              indoor: l.indoor,
            })),
            count: results.length,
          }
        },
      }),
    },
    maxSteps: 3,
  })

  return result.toUIMessageStreamResponse()
}
