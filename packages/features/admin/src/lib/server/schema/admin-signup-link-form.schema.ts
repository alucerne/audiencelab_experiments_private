import { z } from 'zod';

import { AdminCreditsSchema } from './admin-credits-form.schema';

export const AdminSignupLinkFormSchema = z.object({
  signup: z.object({
    name: z.string().min(2).max(50),
    code: z.string().min(5).max(30),
    max_usage: z.coerce.number().int().min(0).optional(),
    expires_at: z.coerce.date().optional(),
  }),
  permissions: AdminCreditsSchema,
});
