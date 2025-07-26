import { z } from 'zod';

const FacebookSchema = z.object({
  integrationKey: z.literal('facebook-ads'),
  fbAdAccountId: z.string().min(1, 'Please select an ad account'),
  fbAdAccountName: z.string().min(1, 'Please select an ad account'),
  fbAudienceId: z.string().min(1, 'Please select a custom audience'),
  fbAudienceName: z.string().min(1, 'Please select a custom audience'),
});

//! add schemas here for new integrations
// const GoogleSchema = z.object({
//   integrationKey: z.literal('google-ads'),
//   googleAccountId: z.string().min(1, 'Please select a Google Ads account'),
//   googleAccountName: z.string().min(1, 'Please select a Google Ads account'),
//   googleAudienceId: z.string().min(1, 'Please select a Google Audience'),
//   googleAudienceName: z.string().min(1, 'Please select a Google Audience'),
// });

export const NewSyncFormSchema = z.object({
  integration: z.discriminatedUnion('integrationKey', [
    FacebookSchema,
    //!add new integrations below
  ]),
  audienceId: z.string().min(1, 'Please select an audience'),
  refreshInterval: z.enum(['1', '3', '7', '14', '30']),
});

export type IntegrationKey = z.infer<
  typeof NewSyncFormSchema
>['integration']['integrationKey'];

export const validIntegrationKeys =
  NewSyncFormSchema.shape.integration.options.map(
    (schema) => schema.shape.integrationKey.value,
  );

export function isIntegrationKey(k: string): k is IntegrationKey {
  return validIntegrationKeys.some((key) => key === k);
}
