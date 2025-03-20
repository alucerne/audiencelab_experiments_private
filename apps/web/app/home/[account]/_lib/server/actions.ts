'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';

export const testWebhookUrlAction = enhanceAction(
  async ({ webhookUrl }) => {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:
          'Hello from Audience Lab! Your webhook as successfully been connected.',
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to send test notification');
    }
  },
  {
    schema: z.object({
      webhookUrl: z.string().trim().url(),
    }),
  },
);
