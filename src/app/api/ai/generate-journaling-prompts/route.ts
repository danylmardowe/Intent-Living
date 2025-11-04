import { NextRequest, NextResponse } from 'next/server'
import { generateJournalingPrompts } from '@/ai/flows/personalized-journaling-prompts'

/**
 * In-memory, per-key cache (user+timeWindow+day) and light rate limiting.
 */
type CacheKey = string
type CacheVal = { prompts: string[]; expiresAt: number }
const CACHE = new Map<CacheKey, CacheVal>()
const TEN_MIN = 10 * 60 * 1000

// Very small token bucket per ip to absorb accidental render loops
const RATE: Map<string, { tokens: number; refillAt: number }> = new Map()
const RATE_WINDOW = 60_000;      // 1 minute
const RATE_TOKENS = 12;          // allow 12 req/min per ip

function todayId(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ipOf(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    // @ts-ignore
    (req as any).ip ||
    'unknown'
  )
}

function rateOk(ip: string) {
  const now = Date.now()
  const slot = RATE.get(ip) ?? { tokens: RATE_TOKENS, refillAt: now + RATE_WINDOW }
  if (now > slot.refillAt) {
    slot.tokens = RATE_TOKENS
    slot.refillAt = now + RATE_WINDOW
  }
  if (slot.tokens <= 0) {
    RATE.set(ip, slot)
    return false
  }
  slot.tokens -= 1
  RATE.set(ip, slot)
  return true
}

export async function POST(req: NextRequest) {
  const ip = ipOf(req)

  try {
    // HARD GUARD: only handle requests that opt-in with a header.
    // This prevents unrelated pages/components from accidentally calling this endpoint.
    const intent = req.headers.get('x-intent-context')
    if (intent !== 'journaling-prompts') {
      return NextResponse.json(
        { prompts: [], ignored: true, reason: 'missing x-intent-context' },
        { status: 204 }
      )
    }

    if (!rateOk(ip)) {
      // Soft fail with a small cache-friendly response
      return NextResponse.json(
        {
          prompts: [
            'Looking back on today, what mattered most and why?',
            'Where did you make progress or get stuck, and what patterns do you notice?',
            'What’s one concrete thing you’ll do tomorrow?',
          ],
          fallback: true,
          error: 'rate_limited',
        },
        { status: 200 }
      )
    }

    const body = await req.json()
    const {
      timeWindow = 'daily',
      pastJournalEntries = [],
      activeTasks = [],
      activeGoals = [],
      activeLifeAreas = [],
      userId = 'anon',
    } = body || {}

    const key: CacheKey = `${userId}:${timeWindow}:${todayId()}`
    const cached = CACHE.get(key)
    const now = Date.now()
    if (cached && cached.expiresAt > now) {
      return NextResponse.json({ prompts: cached.prompts, cached: true })
    }

    const { prompts } = await generateJournalingPrompts({
      timeWindow: String(timeWindow),
      pastJournalEntries: Array.isArray(pastJournalEntries) ? pastJournalEntries : [],
      activeTasks: Array.isArray(activeTasks) ? activeTasks : [],
      activeGoals: Array.isArray(activeGoals) ? activeGoals : [],
      activeLifeAreas: Array.isArray(activeLifeAreas) ? activeLifeAreas : [],
    })

    CACHE.set(key, { prompts, expiresAt: now + TEN_MIN })
    return NextResponse.json({ prompts })
  } catch (err: any) {
    const msg = String(err?.message ?? '')
    const fallback = [
      'Looking back on today, what mattered most and why?',
      'Where did you make progress or get stuck, and what patterns do you notice?',
      'What’s the one concrete thing you’ll do tomorrow to move forward?',
    ]
    return NextResponse.json(
      {
        prompts: fallback,
        fallback: true,
        error: 'upstream_or_unknown',
        detail: msg,
      },
      { status: 200 }
    )
  }
}
