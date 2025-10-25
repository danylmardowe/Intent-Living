'use server';

/**
 * @fileOverview Generates personalized journaling prompts based on user data.
 *
 * - generateJournalingPrompts - A function that generates personalized journaling prompts.
 * - GenerateJournalingPromptsInput - The input type for the generateJournalingPrompts function.
 * - GenerateJournalingPromptsOutput - The return type for the generateJournalingPrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateJournalingPromptsInputSchema = z.object({
  timeWindow: z
    .string()
    .describe(
      'The time window to consider when generating prompts (e.g., daily, weekly, monthly).' /* Enum values? */
    ),
  pastJournalEntries: z.array(z.string()).describe('Past journal entries.'),
  activeTasks: z.array(z.string()).describe('Active tasks.'),
  activeGoals: z.array(z.string()).describe('Active goals.'),
  activeLifeAreas: z.array(z.string()).describe('Active life areas.'),
});
export type GenerateJournalingPromptsInput = z.infer<typeof GenerateJournalingPromptsInputSchema>;

const GenerateJournalingPromptsOutputSchema = z.object({
  prompts: z.array(z.string()).describe('Generated personalized journaling prompts.'),
});
export type GenerateJournalingPromptsOutput = z.infer<typeof GenerateJournalingPromptsOutputSchema>;

export async function generateJournalingPrompts(
  input: GenerateJournalingPromptsInput
): Promise<GenerateJournalingPromptsOutput> {
  return generateJournalingPromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJournalingPromptsPrompt',
  input: {schema: GenerateJournalingPromptsInputSchema},
  output: {schema: GenerateJournalingPromptsOutputSchema},
  prompt: `You are an AI journaling assistant that generates personalized journaling prompts.

  Based on the following information, generate 3 journaling prompts to help the user reflect.

  Time Window: {{{timeWindow}}}
  Past Journal Entries: {{#if pastJournalEntries}}{{#each pastJournalEntries}}- {{{this}}}{{/each}}{{else}}No past journal entries.{{/if}}
  Active Tasks: {{#if activeTasks}}{{#each activeTasks}}- {{{this}}}{{/each}}{{else}}No active tasks.{{/if}}
  Active Goals: {{#if activeGoals}}{{#each activeGoals}}- {{{this}}}{{/each}}{{else}}No active goals.{{/if}}
  Active Life Areas: {{#if activeLifeAreas}}{{#each activeLifeAreas}}- {{{this}}}{{/each}}{{else}}No active life areas.{{/if}}

  The prompts should be open-ended and encourage deep reflection.  Consider the cross-area awareness, and user's current mode when creating the prompts.
  Tone: Coaching, supportive, and very honest (direct, sometimes \"brutally honest\" while remaining empathetic).
  Privacy: All data used by you stays within the user's account.
  The user has the option to toggle Personalization and Natural Language parsing on/off independently, so your output should adjust accordingly.
  Return the prompts as a numbered list.  For example:
  1. What did you accomplish today?
  2. What obstacles did you face?
  3. How can you improve tomorrow?
`,
});

const generateJournalingPromptsFlow = ai.defineFlow(
  {
    name: 'generateJournalingPromptsFlow',
    inputSchema: GenerateJournalingPromptsInputSchema,
    outputSchema: GenerateJournalingPromptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
