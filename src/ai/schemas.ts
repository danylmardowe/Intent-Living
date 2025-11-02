import { z } from 'zod'

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
})

export type GenerateOutput = z.infer<typeof GenerateOutputSchema>

export type GenerateContext = {
  lifeAreas?: { name: string }[]
  tasks?: { title: string }[]
  goals?: { title: string }[]
  activityTypes?: { title: string }[]
}
