import { z } from 'zod';

const importRowSchema = z.object({
  line: z.coerce.number().int().min(1).optional(),
  platform: z.enum(['tiktok', 'shopee', 'lazada']),
  shopId: z.string().min(1).max(80),
  externalOrderId: z.string().min(1).max(120),
  sku: z.string().min(2).max(60),
  quantity: z.coerce.number().int().min(1).max(10000),
  grossAmountVnd: z.coerce.number().int().min(0).max(500000000),
  netAmountVnd: z.coerce.number().int().min(0).max(500000000).optional(),
  affiliateCode: z.string().max(32).optional().default(''),
  status: z.enum(['placed', 'confirmed', 'completed', 'cancelled', 'refunded']).optional().default('placed'),
  orderedAt: z.string().max(60).optional()
});

export const previewImportSchema = z.object({
  rows: z.array(importRowSchema).min(1).max(200)
});

export const batchIdParamSchema = z.object({
  id: z.string().min(1).max(80)
});

export const webhookPlatformParamSchema = z.object({
  platform: z.enum(['tiktok', 'shopee', 'lazada'])
});
