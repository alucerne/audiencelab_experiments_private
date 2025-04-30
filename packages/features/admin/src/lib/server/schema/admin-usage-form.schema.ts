import { z } from 'zod';

export const AdminUsageFormSchema = z.object({
  current_audience: z.coerce.number().int().min(0),
  current_enrichment: z.coerce.number().int().min(0),
  current_custom: z.coerce.number().int().min(0),
  id: z.string().uuid(),
});
