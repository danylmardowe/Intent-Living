import { NextRequest, NextResponse } from 'next/server';
import { generateTasksActivitiesFlow } from '@/ai/flows/generate-tasks-activities';
import { GenerateContext } from '@/ai/schemas';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { input, context } = (await req.json()) as {
      input: string;
      context?: GenerateContext;
    };

    if (!input) {
      return NextResponse.json({ error: 'Input text is required.' }, { status: 400 });
    }

    // Call the Genkit flow directly
    const data = await generateTasksActivitiesFlow({ input, context });
    
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('[GENKIT_FLOW_ERROR]', e);
    return NextResponse.json(
      { error: e?.message || 'An unknown error occurred during generation.' },
      { status: 500 }
    );
  }
}