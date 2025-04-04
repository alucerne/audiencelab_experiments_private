import { z } from 'zod';

export const AdminNewTeamFormSchema = z.object({
  audience_size_limit: z.coerce.number().int().min(0),
  b2b_access: z.boolean().default(false),
  enrichment_size_limit: z.coerce.number().int().min(0),
  intent_access: z.boolean().default(false),
  max_audience_lists: z.coerce.number().int().min(0),
  max_custom_interests: z.coerce.number().int().min(0),
  monthly_enrichment_limit: z.coerce.number().int().min(0),
  user_email: z.string().email(),
  user_team_name: z.string(),
  redirect_to: z.string().trim().min(1),
});
