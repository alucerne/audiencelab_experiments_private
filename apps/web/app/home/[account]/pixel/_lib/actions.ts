'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';

export const testWebhookUrlAction = enhanceAction(
  async ({ webhookUrl }) => {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [
          {
            timestamp: '2025-05-12T22:16:25Z',
            sha: '024a1c8de967978e8ee1686cd2548d43fb0207300df506710eb1d0af59ded43b',
            ip_address: '130.211.3.112',
            resolution: {
              AGE_RANGE: '55-64',
              BUSINESS_EMAIL: 'dora@bpmsupreme.com, dramirez@sandiego.gov',
              CHILDREN: 'Y',
              DEEP_VERIFIED_EMAILS: '',
              DEPARTMENT: 'Operations',
              DIRECT_NUMBER:
                '+16198223847, +18584925017, +16195885277, +16194175959',
              DIRECT_NUMBER_DNC: 'N, N, Y, Y',
              FIRST_NAME: 'Dora',
              GENDER: 'F',
              HOMEOWNER: 'Y',
              INTERESTS: '',
              JOB_TITLE: 'Office Administrator',
              LAST_NAME: 'Ramirez',
              LINKEDIN_URL:
                'https://linkedin.com/in/dora-natalie-ramirez-54aa27b1',
              MARRIED: 'Y',
              MOBILE_PHONE: '+16198223847, +16194175959',
              MOBILE_PHONE_DNC: 'N, Y',
              NET_WORTH: '$500,000 to $749,999',
              PERSONAL_ADDRESS: '1817 Wind Riv Rd',
              PERSONAL_CITY: 'El Cajon',
              PERSONAL_EMAILS:
                'zerimaras@sbcglobal.net, zerimaradjr@sbcglobal.net',
              PERSONAL_PHONE:
                '+16198223847, +18584925017, +16195885277, +16194175959',
              PERSONAL_PHONE_DNC: 'N, N, Y, Y',
              PERSONAL_STATE: 'CA',
              PERSONAL_ZIP: '92019',
              PERSONAL_ZIP4: '4133',
              SENIORITY_LEVEL: 'Staff',
              SHA256_BUSINESS_EMAIL:
                'd70ec08b6e2d3efe21884afc84ce64524a9390ceb4abdeb29969c1b591abec4d, a071604cb98177fd14edbd7b2ccea2a09ab43e8f2ccb1d6f89d33d4548dd2f51',
              SHA256_PERSONAL_EMAIL: [
                '024a1c8de967978e8ee1686cd2548d43fb0207300df506710eb1d0af59ded43b',
                'fea82b2d4705cdc362e779fcca2226bf461982cf6407f96178b1f4f8947f7bd5',
              ],
              SKILLS: '',
              UUID: '946079746a7c4cc37b4359fccd',
            },
          },
          {
            timestamp: '2025-05-12T22:16:29Z',
            sha: 'f64a9238935c5323f1b92739b18072e357d6846eff1e415acf02c92cd2c9be04',
            ip_address: '130.211.3.55',
            resolution: {
              AGE_RANGE: '45-54',
              BUSINESS_EMAIL: '',
              CHILDREN: 'Y',
              DEEP_VERIFIED_EMAILS: '',
              DIRECT_NUMBER: '+13862900578, +17736276759, +17733758240',
              DIRECT_NUMBER_DNC: 'Y, N, Y',
              FIRST_NAME: 'Daryl',
              GENDER: 'M',
              HOMEOWNER: 'Y',
              INTERESTS: '',
              LAST_NAME: 'Grief',
              MARRIED: 'N',
              MOBILE_PHONE: '+17736276759, +13862900578',
              MOBILE_PHONE_DNC: 'N, Y',
              NET_WORTH: '$75,000 to $99,999',
              PERSONAL_ADDRESS: '2717 Plumosus Ct',
              PERSONAL_CITY: 'DeLand',
              PERSONAL_EMAILS: 'male71572@aol.com',
              PERSONAL_PHONE: '+13862900578, +17736276759, +17733758240',
              PERSONAL_PHONE_DNC: 'Y, N, Y',
              PERSONAL_STATE: 'FL',
              PERSONAL_ZIP: '32724',
              PERSONAL_ZIP4: '1515',
              SHA256_BUSINESS_EMAIL: '',
              SHA256_PERSONAL_EMAIL: [
                'f64a9238935c5323f1b92739b18072e357d6846eff1e415acf02c92cd2c9be04',
              ],
              SKILLS: '',
              SKIPTRACE_ADDRESS: '2226 N Kepler Rd',
              SKIPTRACE_CITY: 'Deland',
              SKIPTRACE_CREDIT_RATING: 'C',
              SKIPTRACE_DNC: 'Y',
              SKIPTRACE_ETHNIC_CODE: 'T3',
              SKIPTRACE_EXACT_AGE: '52',
              SKIPTRACE_IP: '72.184.43.43',
              SKIPTRACE_LANGUAGE_CODE: 'E1',
              SKIPTRACE_MATCH_SCORE: 5,
              SKIPTRACE_NAME: 'DARYL GRIEF',
              SKIPTRACE_STATE: 'FL',
              SKIPTRACE_ZIP: '32724',
              UUID: 'b5b2e268a37f5daddfe3cfcdc3',
            },
          },
          {
            timestamp: '2025-05-12T22:16:31Z',
            sha: 'b8ca6a5a40577bfd11c5c8a58f295031a9f82b6654af77b32bdf0868f2810ffa',
            ip_address: '130.211.3.114',
            resolution: {
              AGE_RANGE: '45-54',
              BUSINESS_EMAIL: '',
              CHILDREN: 'Y',
              DEEP_VERIFIED_EMAILS: '',
              DIRECT_NUMBER: '+16052809171, +16052249124, +16052223311',
              DIRECT_NUMBER_DNC: 'Y, Y, N',
              FIRST_NAME: 'Kenneth',
              GENDER: 'M',
              HOMEOWNER: 'Y',
              INCOME_RANGE: '$100,000 to $149,999',
              INTERESTS: '',
              LAST_NAME: 'Hutchinson',
              MARRIED: 'Y',
              MOBILE_PHONE: '+16052809171, +16052223311',
              MOBILE_PHONE_DNC: 'Y, N',
              NET_WORTH: '-$2,499 to $2,499',
              PERSONAL_ADDRESS: '113 Sheila Dr',
              PERSONAL_CITY: 'Pierre',
              PERSONAL_EMAILS: 'aaronn114@gmail.com, dbch001@gmail.com',
              PERSONAL_PHONE:
                '+16052809171, +16052249124, +16052233204, +16052223311',
              PERSONAL_PHONE_DNC: 'Y, Y, Y, N',
              PERSONAL_STATE: 'SD',
              PERSONAL_ZIP: '57501',
              PERSONAL_ZIP4: '2887',
              SHA256_BUSINESS_EMAIL: '',
              SHA256_PERSONAL_EMAIL: [
                'b8ca6a5a40577bfd11c5c8a58f295031a9f82b6654af77b32bdf0868f2810ffa',
                '88dff1b05bc09002fcc5ecfa4ca3433d62c2ce64212472cde67f54b476120931',
              ],
              SKILLS: '',
              SKIPTRACE_ADDRESS: '200 Orion Ave',
              SKIPTRACE_CITY: 'Pierre',
              SKIPTRACE_CREDIT_RATING: 'C',
              SKIPTRACE_ETHNIC_CODE: 'T3',
              SKIPTRACE_EXACT_AGE: '51',
              SKIPTRACE_LANGUAGE_CODE: 'E1',
              SKIPTRACE_MATCH_SCORE: 3,
              SKIPTRACE_NAME: 'KENNETH HUTCHINSON',
              SKIPTRACE_STATE: 'SD',
              SKIPTRACE_WIRELESS_NUMBERS: '+16052204349',
              SKIPTRACE_ZIP: '57501',
              UUID: '4bd9f9ec4405c5ae98bc95c116',
            },
          },
        ],
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
