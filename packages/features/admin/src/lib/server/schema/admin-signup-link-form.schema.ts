import { z } from 'zod';

export const AdminSignupLinkFormSchema = z.object({
  signup: z.object({
    name: z.string().min(2).max(50),
    code: z.string().min(5).max(30),
    max_usage: z.coerce.number().int().min(0).optional(),
    expires_at: z.coerce.date().optional(),
  }),
  permissions: z.object({
    audience_size_limit: z.coerce.number().int().min(0),
    b2b_access: z.boolean().default(false),
    enrichment_size_limit: z.coerce.number().int().min(0),
    intent_access: z.boolean().default(false),
    monthly_audience_limit: z.coerce.number().int().min(0),
    max_custom_interests: z.coerce.number().int().min(0),
    monthly_enrichment_limit: z.coerce.number().int().min(0),
    pixel_size_limit: z.coerce.number().int().min(0),
    monthly_pixel_limit: z.coerce.number().int().min(0),
  }),
});
