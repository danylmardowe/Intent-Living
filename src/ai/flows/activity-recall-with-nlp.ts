'use server';

/**
 * @fileOverview Implements activity recall with natural language processing.
 *
 * - activityRecallWithNLP - A function that handles activity recall using NLP.
 * - ActivityRecallWithNLPInput - The input type for the activityRecallWithNLP function.
 * - ActivityRecallWithNLPOutput - The return type for the activityRecallWithNLP function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActivityRecallWithNLPInputSchema = z.object({
  userInput: z
    .string()
    .describe('The user input describing their activities.'),
});
export type ActivityRecallWithNLPInput = z.infer<typeof ActivityRecallWithNLPInputSchema>;

const ActivityRecallWithNLPOutputSchema = z.object({
  structuredActivities: z.array(
    z.object({
      activity: z.string().describe('The activity performed.'),
      startTime: z.string().optional().describe('The start time of the activity.'),
      duration: z.string().optional().describe('The duration of the activity.'),
    })
  ).describe('The structured activities extracted from the user input.'),
});
export type ActivityRecallWithNLPOutput = z.infer<typeof ActivityRecallWithNLPOutputSchema>;

export async function activityRecallWithNLP(input: ActivityRecallWithNLPInput): Promise<ActivityRecallWithNLPOutput> {
  return activityRecallWithNLPFlow(input);
}

const activityRecallWithNLPPrompt = ai.definePrompt({
  name: 'activityRecallWithNLPPrompt',
  input: {schema: ActivityRecallWithNLPInputSchema},
  output: {schema: ActivityRecallWithNLPOutputSchema},
  prompt: `You are an expert activity parser.  You will take in what the user did today, and parse out structured activity entries.  These activity entries will have the activity, start time, and duration.

User Input: {{{userInput}}}

Output the activity entries in JSON format.  The 'startTime' and 'duration' fields are optional.

Example:
{
  "structuredActivities": [
    {
      "activity": "Worked on project",
      "startTime": "9:00 AM",
      "duration": "2 hours"
    },
    {
      "activity": "Went to lunch",
      "startTime": "11:00 AM",
      "duration": "1 hour"
    },
    {
      "activity": "Meeting with John",
    }
  ]
}
`,
});

const activityRecallWithNLPFlow = ai.defineFlow(
  {
    name: 'activityRecallWithNLPFlow',
    inputSchema: ActivityRecallWithNLPInputSchema,
    outputSchema: ActivityRecallWithNLPOutputSchema,
  },
  async input => {
    const {output} = await activityRecallWithNLPPrompt(input);
    return output!;
  }
);
