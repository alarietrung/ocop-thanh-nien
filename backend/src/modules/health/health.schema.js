import { z } from 'zod';

export const readyQuerySchema = z.object({
  verbose: z.enum(['true', 'false']).optional().default('false')
});
