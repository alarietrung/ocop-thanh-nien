import { z } from 'zod';

export const addListingSchema = z.object({
  platform: z.enum(['tiktok', 'shopee', 'lazada']),
  url: z.string().url().max(400),
  shopId: z.string().min(2).max(80).optional(),
  externalItemId: z.string().min(2).max(80).optional()
});

export const productIdParamSchema = z.object({
  id: z.string().min(1).max(80)
});
