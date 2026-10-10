import { z } from 'zod';

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  topic: z.enum(['assessment', 'ideas', 'marketplace', 'collection', 'accessibility', 'other']),
  message: z.string().trim().min(10).max(2000),
});
