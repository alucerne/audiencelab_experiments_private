import { z } from 'zod';

export const AdminCreditsFormSchema = z.object({
  audience_size_limit: z.coerce.number().int().positive(),
  b2b_access: z.boolean().default(false),
  enrichment_size_limit: z.coerce.number().int().positive(),
  intent_access: z.boolean().default(false),
  max_audience_lists: z.coerce.number().int().positive(),
  max_custom_interests: z.coerce.number().int().positive(),
  monthly_enrichment_limit: z.coerce.number().int().positive(),
  id: z.string().uuid(),
});
