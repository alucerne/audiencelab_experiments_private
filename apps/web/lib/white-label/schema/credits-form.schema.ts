import { z } from 'zod';

export const CreditsSchema = z.object({
  audience_size_limit: z.coerce.number().int().min(0),
  b2b_access: z.boolean().default(false),
  enrichment_size_limit: z.coerce.number().int().min(0),
  intent_access: z.boolean().default(false),
  monthly_audience_limit: z.coerce.number().int().min(0),
  max_custom_interests: z.coerce.number().int().min(0),
  monthly_enrichment_limit: z.coerce.number().int().min(0),
  pixel_size_limit: z.coerce.number().int().min(0),
  monthly_pixel_limit: z.coerce.number().int().min(0),
});

export const CreditsFormSchema = CreditsSchema.extend({
  id: z.string().uuid(),
});
