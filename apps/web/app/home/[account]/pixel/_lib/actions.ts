'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';

export const testWebhookUrlAction = enhanceAction(
  async ({ webhookUrl }) => {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(WEBOOK_SAMPLE),
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

const WEBOOK_SAMPLE = {
  events: [
    {
      pixel_id: '003daacb-d261-421c-9781-311df9c38eee',
      hem_sha256:
        '9e226e0155447de4923767540065bb9f0fe711b2dda4cdee0d8be0974b5ef888',
      event_timestamp: '2025-05-23T18:50:41Z',
      event_type: 'page_view',
      ip_address: '35.191.30.111',
      activity_start_date: '2025-05-23T18:50:41Z',
      activity_end_date: '2025-05-23T18:51:41Z',
      event_data:
        '{"referrer":null,"timestamp":"2025-05-23T00:00:00.060Z","title":"About Us","url":"https://example.com/about-us/"}',
      referrer_url: 'https://example.com/',
      resolution: {
        AGE_RANGE: '65 and older',
        BUSINESS_EMAIL: '',
        CHILDREN: 'Y',
        COMPANY_NAICS: '',
        COMPANY_SIC: '',
        DEEP_VERIFIED_EMAILS: '',
        DIRECT_NUMBER: '+19155811111',
        DIRECT_NUMBER_DNC: 'Y',
        FIRST_NAME: 'Laurie',
        GENDER: 'F',
        HOMEOWNER: 'Y',
        INCOME_RANGE: '$150,000 to $199,999',
        INTERESTS: '',
        LAST_NAME: 'Bradford',
        MARRIED: 'Y',
        MOBILE_PHONE: '',
        MOBILE_PHONE_DNC: '',
        NET_WORTH: '$750,000 to $999,999',
        PERSONAL_ADDRESS: '6533 Eagle Rdg Dr',
        PERSONAL_CITY: 'El Paso',
        PERSONAL_EMAILS: 'lsbradford1@gmail.com',
        PERSONAL_PHONE: '+19155811111',
        PERSONAL_PHONE_DNC: 'Y',
        PERSONAL_STATE: 'TX',
        PERSONAL_ZIP: '79912',
        PERSONAL_ZIP4: '7428',
        SHA256_BUSINESS_EMAIL: '',
        SHA256_PERSONAL_EMAIL:
          '9e226e0155447de4923767540065bb9f0fe711b2dda4cdee0d8be0974b5ef888',
        SKILLS: '',
        UUID: '813fa3b5e192f864a1e9a1fdb3',
      },
    },
    {
      pixel_id: '003daacb-d261-421c-9781-311df9c38eee',
      hem_sha256:
        '9e226e0155447de4923767540065bb9f0fe711b2dda4cdee0d8be0974b5ef888',
      event_timestamp: '2025-05-23T18:50:41Z',
      event_type: 'page_view',
      ip_address: '35.191.30.111',
      activity_start_date: '2025-05-23T18:50:41Z',
      activity_end_date: '2025-05-23T18:51:41Z',
      event_data:
        '{"referrer":null,"timestamp":"2025-05-23T00:00:00.060Z","title":"About Us","url":"https://example.com/about-us/"}',
      referrer_url: 'https://example.com/',
      resolution: {
        AGE_RANGE: '65 and older',
        BUSINESS_EMAIL: '',
        CHILDREN: 'Y',
        COMPANY_NAICS: '',
        COMPANY_SIC: '',
        DEEP_VERIFIED_EMAILS: '',
        DIRECT_NUMBER: '+19155811111',
        DIRECT_NUMBER_DNC: 'Y',
        FIRST_NAME: 'Laurie',
        GENDER: 'F',
        HOMEOWNER: 'Y',
        INCOME_RANGE: '$150,000 to $199,999',
        INTERESTS: '',
        LAST_NAME: 'Bradford',
        MARRIED: 'Y',
        MOBILE_PHONE: '',
        MOBILE_PHONE_DNC: '',
        NET_WORTH: '$750,000 to $999,999',
        PERSONAL_ADDRESS: '6533 Eagle Rdg Dr',
        PERSONAL_CITY: 'El Paso',
        PERSONAL_EMAILS: 'lsbradford1@gmail.com',
        PERSONAL_PHONE: '+19155811111',
        PERSONAL_PHONE_DNC: 'Y',
        PERSONAL_STATE: 'TX',
        PERSONAL_ZIP: '79912',
        PERSONAL_ZIP4: '7428',
        SHA256_BUSINESS_EMAIL: '',
        SHA256_PERSONAL_EMAIL:
          '9e226e0155447de4923767540065bb9f0fe711b2dda4cdee0d8be0974b5ef888',
        SKILLS: '',
        UUID: '813fa3b5e192f864a1e9a1fdb3',
      },
    },
  ],
};
