'use server';

import { ai } from '@/ai/genkit';
import { GenerateContextSchema, GenerateOutputSchema } from '@/ai/schemas';
import { z } from 'zod';

// Define the input schema for our new flow
const GenerateTasksInputSchema = z.object({
  input: z.string(),
  context: GenerateContextSchema.optional(),
});

const MODEL_NAME = `googleai/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}`;

// Define the AI prompt using Genkit's definePrompt
const generationPrompt = ai.definePrompt({
  name: 'tasksActivitiesGenerator',
  input: { schema: GenerateTasksInputSchema },
  // FIX: REMOVED the "output" schema. The AI will now return a plain string.
  // output: { schema: GenerateOutputSchema }, 
  model: MODEL_NAME, 
  
  prompt: `You extract structured tasks and activities from a short daily text.
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

DO NOT include any commentary. ONLY JSON.

Context:
Life areas: {{#if context.lifeAreas}}{{#each context.lifeAreas}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}(none){{/if}}
Known goals: {{#if context.goals}}{{#each context.goals}}{{this.title}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}(none){{/if}}
Known tasks: {{#if context.tasks}}{{#each context.tasks}}{{this.title}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}(none){{/if}}
Activity types: {{#if context.activityTypes}}{{#each context.activityTypes}}{{this.title}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}(none){{/if}}
User text: """{{{input}}}"""`,
});

// Define the flow that runs the prompt
export const generateTasksActivitiesFlow = ai.defineFlow(
  {
    name: 'generateTasksActivitiesFlow',
    inputSchema: GenerateTasksInputSchema,
    outputSchema: GenerateOutputSchema,
  },
  async (payload) => {
    // FIX: Manually handle the raw text output
    const { output: rawText } = await generationPrompt(payload);

    if (!rawText) {
      throw new Error('AI returned an empty response.');
    }

    // Clean up potential markdown code fences
    const jsonText = rawText.replace(/^```json\s*/i, '').replace(/```$/, '');

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch(e) {
      console.error("AI returned non-JSON output:", rawText);
      throw new Error('The AI returned an invalid format. Please try rephrasing your input.');
    }

    // Manually validate the parsed JSON against our schema
    const validated = GenerateOutputSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("AI output failed validation:", validated.error.issues);
      throw new Error('AI output did not match the expected structure.');
    }

    return validated.data;
  }
);