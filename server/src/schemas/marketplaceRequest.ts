import { z } from 'zod';

export const marketplaceRequestSchema = z.object({
  listingId: z.string().regex(/^[a-f\d]{24}$/i),
  quantity: z.coerce.number().int().min(1).max(10000),
  message: z.string().trim().max(1000).optional().default(''),
  buyerPhone: z.string().trim().regex(/^\+?[\d\s().-]{7,20}$/, 'Enter a valid phone number.'),
  sharePhoneWithSeller: z.coerce.boolean().refine(Boolean, 'Agree to share your phone number with the seller.'),
});

export const marketplaceRequestStatusSchema = z.object({ status: z.enum(['accepted', 'declined']) });
