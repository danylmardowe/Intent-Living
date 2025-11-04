import { z } from 'zod';

// This is the schema for the AI's output, which is already correct.
export const GenerateOutputSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional().default(''),
        lifeAreaName: z.string().optional(),
        goalTitle: z.string().optional(),
        status: z
          .enum(['backlog', 'scheduled', 'today', 'inprogress', 'blocked'])
          .optional()
          .default('scheduled'),
        importance: z.number().min(0).max(100).optional().default(50),
        urgency: z.number().min(0).max(100).optional().default(40),
        dueDaysFromNow: z.number().int().optional().default(1),
        startOffsetMin: z.number().int().optional().default(0),
      })
    )
    .default([]),
  activities: z
    .array(
      z.object({
        title: z.string(),
        activityTypeTitle: z.string().optional(),
        lifeAreaName: z.string().optional(),
        durationMin: z.number().int().optional().default(30),
        startOffsetMin: z.number().int().optional().default(0),
      })
    )
    .default([]),
});

// This is the new schema that was missing. It defines the structure of the context object.
export const GenerateContextSchema = z.object({
  lifeAreas: z.array(z.object({ name: z.string() })).optional(),
  tasks: z.array(z.object({ title: z.string() })).optional(),
  goals: z.array(z.object({ title: z.string() })).optional(),
  activityTypes: z.array(z.object({ title: z.string() })).optional(),
});

// TypeScript types inferred from the schemas
export type GenerateOutput = z.infer<typeof GenerateOutputSchema>;
export type GenerateContext = z.infer<typeof GenerateContextSchema>;