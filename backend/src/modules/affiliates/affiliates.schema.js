import { z } from 'zod';

export const createAffiliateLinkSchema = z.object({
  productId: z.string().min(1).max(80),
  platform: z.enum(['tiktok', 'shopee', 'lazada']).optional()
});

export const linkIdParamSchema = z.object({
  id: z.string().min(1).max(80)
});

export const redirectCodeParamSchema = z.object({
  code: z.string().min(4).max(32).regex(/^[A-Za-z0-9_-]+$/)
});
