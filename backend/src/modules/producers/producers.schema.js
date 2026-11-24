import { z } from 'zod';

export const catalogQuerySchema = z.object({
  q: z.string().max(120).optional().default(''),
  category: z.string().max(40).optional().default('all'),
  platform: z.enum(['all', 'tiktok', 'shopee', 'lazada']).optional().default('all'),
  sort: z.enum(['featured', 'commission_desc', 'price_asc', 'price_desc']).optional().default('featured'),
  page: z.coerce.number().int().min(1).max(200).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(12)
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(120)
});

export const idParamSchema = z.object({
  id: z.string().min(1).max(80)
});

const listingInputSchema = z.object({
  platform: z.enum(['tiktok', 'shopee', 'lazada']),
  url: z.string().url().max(400),
  shopId: z.string().max(80).optional(),
  externalItemId: z.string().max(80).optional()
});

export const sellerProductCreateSchema = z.object({
  title: z.string().min(3).max(160),
  categoryId: z.enum(['hat-say', 'mat-ong-tra', 'ca-phe-ca-cao', 'gia-vi-tinh-dau']),
  unit: z.string().min(1).max(60),
  spec: z.string().min(3).max(240),
  priceVnd: z.coerce.number().int().min(1000).max(500000000),
  stock: z.coerce.number().int().min(0).max(1000000),
  commissionRateBps: z.coerce.number().int().min(0).max(10000),
  description: z.string().min(3).max(2000),
  story: z.string().max(1000).optional().default(''),
  imageUrl: z.string().max(500000).optional().default(''),
  listings: z.array(listingInputSchema).max(5).optional().default([])
});

export const sellerProductUpdateSchema = sellerProductCreateSchema.partial();

export const opsReviewSchema = z.object({
  decision: z.enum(['approve', 'request_revision']),
  note: z.string().max(500).optional().default('')
});

export const pilotApplicationSchema = z.object({
  applicantName: z.string().min(2).max(120),
  businessName: z.string().min(2).max(160),
  area: z.string().min(2).max(120),
  productNote: z.string().min(5).max(1000),
  turnstileToken: z.string().max(2048).optional().default('')
});
