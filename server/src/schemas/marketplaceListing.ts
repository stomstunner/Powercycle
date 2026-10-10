import { z } from 'zod';

export const marketplaceListingSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(20).max(2000),
  category: z.string().trim().min(2).max(80),
  condition: z.enum(['upcycled', 'refurbished', 'used_reusable']),
  pricePaise: z.coerce.number().int().min(0).max(10_000_000_00),
  stockQuantity: z.coerce.number().int().min(1).max(10000),
  pickupAvailable: z.coerce.boolean().default(true),
  shippingAvailable: z.coerce.boolean().default(false),
  publicCity: z.string().trim().max(80).optional().default(''),
  publicState: z.string().trim().max(80).optional().default(''),
  sourceIdeaId: z.string().trim().max(80).optional(),
  contactPhone: z.string().trim().max(20).optional().default(''),
  showContactPhone: z.coerce.boolean().default(false),
});
