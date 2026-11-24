import { z } from 'zod';

export const uploadInitSchema = z.object({
  producerId: z.string().min(1).max(80),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'video/webm', 'video/mp4']),
  sizeBytes: z.coerce.number().int().min(1).max(52428800),
  kind: z.enum(['product_image', 'video_draft', 'certification']).default('product_image')
});

export const uploadCompleteSchema = z.object({
  assetId: z.string().min(1).max(80)
});
