import { z } from 'zod';

export const AdminNewTeamFormSchema = z.object({
  audience_size_limit: z.coerce.number().int().positive(),
  b2b_access: z.boolean().default(false),
  enrichment_size_limit: z.coerce.number().int().positive(),
  intent_access: z.boolean().default(false),
  max_audience_lists: z.coerce.number().int().positive(),
  max_custom_interests: z.coerce.number().int().positive(),
  monthly_enrichment_limit: z.coerce.number().int().positive(),
  user_email: z.string().email(),
  user_name: z.string().trim().min(1),
  user_team_name: z.string(),
  redirect_to: z.string().trim().min(1),
});
