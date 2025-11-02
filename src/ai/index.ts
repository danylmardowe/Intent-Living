import { GoogleGenAI } from '@google/genai'
import { GenerateContext, GenerateOutput, GenerateOutputSchema } from './schemas'

const ai = new GoogleGenAI({
  // Do NOT expose this in the browser.
  apiKey: process.env.GEMINI_API_KEY!,
  // Intentionally NOT pinning apiVersion: the SDK defaults to the correct (beta/stable) channel.
  // Ref: JS SDK quickstart and API selection docs.
})

const MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim()

function buildPrompt(input: string, context?: GenerateContext) {
  const sys = `You extract structured tasks and activities from a short daily text.
Return STRICT JSON matching this schema:

{
  "tasks": [
    {
      "title": "string (short, actionable)",
      "description": "string (optional)",
      "lifeAreaName": "string (optional; one of the provided life areas if possible)",
      "goalTitle": "string (optional; one of the provided goals if possible)",
      "status": "backlog|scheduled|today|inprogress|blocked (default scheduled)",
      "importance": 0-100 (default 50),
      "urgency": 0-100 (default 40),
      "dueDaysFromNow": integer (default 1),
      "startOffsetMin": integer minutes from now (default 0)
    }
  ],
  "activities": [
    {
      "title": "string (short)",
      "activityTypeTitle": "string (optional; one of provided activity types if possible)",
      "lifeAreaName": "string (optional; one of the provided life areas)",
      "durationMin": integer (default 30),
      "startOffsetMin": integer (default 0)
    }
  ]
}

DO NOT include any commentary. ONLY JSON.`

  const ctxStr = `Life areas: ${(context?.lifeAreas ?? []).map(a => a.name).join(', ') || '(none)'}
Known goals: ${(context?.goals ?? []).map(g => g.title).join(', ') || '(none)'}
Known tasks: ${(context?.tasks ?? []).map(t => t.title).join(', ') || '(none)'}
Activity types: ${(context?.activityTypes ?? []).map(a => a.title).join(', ') || '(none)'}
User text: """${input.trim()}"""`

  return `${sys}\n\n${ctxStr}`
}

export async function generateTasksActivities(
  input: string,
  context?: GenerateContext
): Promise<GenerateOutput> {
  if (!input || typeof input !== 'string') {
    throw new Error('Missing input')
  }

  const prompt = buildPrompt(input, context)

  const resp = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  })

  const text = (resp as any).text ? String((resp as any).text).trim() : ''
  const jsonText = text.replace(/^```json\s*/i, '').replace(/```$/, '')

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('AI returned non-JSON output')
  }

  const validated = GenerateOutputSchema.safeParse(parsed)
  if (!validated.success) {
    const reasons = validated.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`AI output invalid: ${reasons}`)
  }
  return validated.data
}
