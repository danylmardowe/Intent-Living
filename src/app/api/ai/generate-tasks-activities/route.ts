// src/app/api/ai/generate-tasks-activities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateTasksActivities } from '@/ai'
import type { GenerateContext } from '@/ai/schemas'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { input, context } = (await req.json()) as {
      input: string
      context?: GenerateContext
    }
    const data = await generateTasksActivities(input, context)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 400 })
  }
}
