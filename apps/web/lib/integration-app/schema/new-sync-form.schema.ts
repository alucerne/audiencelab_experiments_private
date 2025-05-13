import { z } from 'zod';

export const NewSyncFormSchema = z.object({
  integration: z.object({
    integrationKey: z.string().min(1, 'Please select a connection'),
    fbAdAccountId: z.string().min(1, 'Please select an ad account'),
    fbAudienceId: z.string().min(1, 'Please select a custom audience'),
  }),
  audienceId: z.string().min(1, 'Please select an audience'),
  refreshInterval: z.enum(['1', '3', '7', '14', '30']),
});
