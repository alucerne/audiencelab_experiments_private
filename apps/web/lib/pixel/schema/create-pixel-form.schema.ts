import { z } from 'zod';

export const createPixelFormSchema = z.object({
  websiteName: z.string().trim().min(2, 'Website name is required'),
  websiteUrl: z.string().trim().url('Invalid URL'),
  webhookUrl: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().trim().url('Invalid URL').optional(),
  ),
});
