import { z } from 'zod';

export const assessmentSchema = z.object({
  deviceType: z.enum(['phone', 'tablet', 'laptop', 'monitor', 'speaker', 'charger', 'keyboard', 'appliance', 'other']),
  ageRange: z.enum(['under-1', '1-3', '3-5', 'over-5', 'unknown']),
  condition: z.enum(['working', 'minor-issue', 'major-issue', 'damaged', 'not-working', 'unknown']),
  problems: z.array(z.enum(['battery', 'screen', 'charging', 'sound', 'performance', 'missing-parts', 'none', 'other'])).max(8),
  notes: z.string().trim().max(1000).optional(),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;
