import { z } from 'zod';

export const ideaProjectSchema = z.object({
  title: z.string().trim().min(4).max(100),
  shortDescription: z.string().trim().min(20).max(500),
  deviceCategory: z.enum(['mobile', 'laptop', 'tablet', 'desktop', 'accessory', 'other']),
  purposeCategory: z.enum(['home_decor', 'useful_gadget', 'learning', 'art_creative', 'environmental_impact', 'other']),
  tags: z.string().optional().default(''),
  steps: z.string().min(2),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const ideaStepSchema = z.object({
  stepId: z.string().min(1).max(80),
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(300),
});
