import { z } from 'zod';

export const collectionRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.string().email().max(320),
  deviceCategory: z.enum(['phone', 'tablet', 'laptop', 'monitor', 'speaker', 'charger', 'keyboard', 'appliance', 'other']),
  itemCount: z.coerce.number().int().min(1).max(50),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pinCode: z.string().trim().min(4).max(12),
  preferredDate: z.string().date(),
  timeSlot: z.enum(['morning', 'afternoon', 'evening']),
  notes: z.string().trim().max(1000).optional(),
  consent: z.literal(true),
});

export type CollectionRequestInput = z.infer<typeof collectionRequestSchema>;
