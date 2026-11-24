import { z } from 'zod';

export const metricsQuerySchema = z.object({
  platform: z.enum(['all', 'tiktok', 'shopee', 'lazada']).optional().default('all')
});

export const reconciliationSchema = z.object({
  orderId: z.string().min(1).max(80),
  nextStatus: z.enum(['confirmed', 'completed', 'cancelled', 'refunded']),
  reason: z.string().max(400).optional().default('')
});
