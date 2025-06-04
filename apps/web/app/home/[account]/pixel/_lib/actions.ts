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
      pixel_id: '003daacb-d261-421c-9781-311df9c381d8',
      hem_sha256:
        '1458ee23320e30d920f099f57b11000b89ab82a7456bf39dd663d9d0858fd88d',
      event_timestamp: '2025-05-29T23:52:53Z',
      event_type: 'page_view',
      ip_address: '35.191.85.117',
      activity_start_date: '2025-05-29T23:52:53Z',
      activity_end_date: '2025-05-29T23:53:53Z',
      event_data: {
        referrer: 'http://m.facebook.com/',
        timestamp: '2025-05-29T23:52:53.633Z',
        title: 'example.com',
        url: 'https://example.com/?fbclid=IwZXh0bgNhZW0BMABhZGlkAasi7LnErLQBHkvPe3ogxPIzpgbWouGmaIf-QkOpOtHgjzrXn0yJrXQVf9OmeaS7Bl-adVpe_aem_nyLfIvd-NuxQZlmIbTs67Q&utm_medium=paid&utm_source=fb&utm_id=120228215089410580&utm_content=120228215155820580&utm_term=120228215089440580&utm_campaign=120228215089410580',
        percentage: 94,
        element: {
          attributes: {
            class: 'elementor-button elementor-button-link elementor-size-sm',
            href: '#gallery',
          },
          classes: 'elementor-button elementor-button-link elementor-size-sm',
          id: null,
          tag: 'A',
          text: 'View custom cabinets\n',
        },
      },
      referrer_url: 'https://example.com/',
      resolution: {
        AGE_RANGE: '65 and older',
        BUSINESS_EMAIL: '',
        CHILDREN: 'Y',
        COMPANY_ADDRESS: '',
        COMPANY_CITY: '',
        COMPANY_DESCRIPTION: '',
        COMPANY_DOMAIN: '',
        COMPANY_EMPLOYEE_COUNT: '',
        COMPANY_INDUSTRY: '',
        COMPANY_NAICS: '',
        COMPANY_NAME: '',
        COMPANY_NAME_HISTORY: '',
        COMPANY_PHONE: '',
        COMPANY_REVENUE: '',
        COMPANY_SIC: '',
        COMPANY_STATE: '',
        COMPANY_ZIP: '',
        DEEP_VERIFIED_EMAILS: '',
        DEPARTMENT: '',
        DIRECT_NUMBER: '+12104382427, +12108237899, +17137836220, +14322144256',
        DIRECT_NUMBER_DNC: 'Y, Y, Y, N',
        EDUCATION_HISTORY: '',
        FACEBOOK_URL: '',
        FIRST_NAME: 'Margaret',
        GENDER: 'F',
        HEADLINE: '',
        HOMEOWNER: 'Y',
        INCOME_RANGE: 'Less than $20,000',
        INFERRED_YEARS_EXPERIENCE: '',
        INTERESTS: '',
        JOB_TITLE: '',
        JOB_TITLE_HISTORY: '',
        LAST_NAME: 'Faz',
        LINKEDIN_URL: '',
        MARRIED: 'Y',
        MOBILE_PHONE: '+12104382427, +14322144256, +12108237899',
        MOBILE_PHONE_DNC: 'Y, N, Y',
        NET_WORTH: '$75,000 to $99,999',
        PERSONAL_ADDRESS: '547 Pinewood Ln',
        PERSONAL_CITY: 'San Antonio',
        PERSONAL_EMAILS:
          'margaretfaz@gmail.com, mf7476439@gmail.com, mflores8589@gmail.com',
        PERSONAL_PHONE: '+12104382427, +12108237899, +14322144256',
        PERSONAL_PHONE_DNC: 'Y, Y, N',
        PERSONAL_STATE: 'TX',
        PERSONAL_ZIP: '78216',
        PERSONAL_ZIP4: '6911',
        SENIORITY_LEVEL: '',
        SHA256_BUSINESS_EMAIL: '',
        SHA256_PERSONAL_EMAIL:
          '1458ee23320e30d920f099f57b11000b89ab82a7456bf39dd663d9d0858fd88d, 38e1e9e2bd652af38d5af129a5a763cd89dfaf0f84db99fdf9c1d4265bb56ecf, 2b863da80b0df29ce907336f4a55c91ef9b70fdc4c3f0b05846600dd2554d56f',
        SKILLS: '',
        SKIPTRACE_ADDRESS: '547 Pinewood Ln',
        SKIPTRACE_B2B_ADDRESS: '',
        SKIPTRACE_B2B_PHONE: '',
        SKIPTRACE_B2B_SOURCE: '',
        SKIPTRACE_B2B_WEBSITE: '',
        SKIPTRACE_CITY: 'San Antonio',
        SKIPTRACE_CREDIT_RATING: 'B',
        SKIPTRACE_DNC: 'Y',
        SKIPTRACE_ETHNIC_CODE: '',
        SKIPTRACE_EXACT_AGE: '76',
        SKIPTRACE_IP: '172.204.161.145',
        SKIPTRACE_LANDLINE_NUMBERS: '',
        SKIPTRACE_LANGUAGE_CODE: 'UX',
        SKIPTRACE_MATCH_SCORE: '11',
        SKIPTRACE_NAME: 'MARGARET FLORES',
        SKIPTRACE_STATE: 'TX',
        SKIPTRACE_WIRELESS_NUMBERS: '',
        SKIPTRACE_ZIP: '78216',
        SOCIAL_CONNECTIONS: '',
        UUID: 'dc0016d3803db4912441edb1b0',
      },
    },
  ],
};
