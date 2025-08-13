/*
Simple billing configuration for experimental deployment
This avoids requiring external billing provider keys
*/
import { createBillingSchema } from '@kit/billing';

export default createBillingSchema({
  provider: 'stripe',
  products: [
    {
      id: 'free',
      name: 'Free',
      description: 'Free tier for experimentation',
      currency: 'USD',
      plans: [
        {
          name: 'Free',
          id: 'free',
          paymentType: 'one-time',
          interval: 'month',
          lineItems: [
            {
              id: 'free',
              name: 'Free',
              cost: 0,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: ['Basic features'],
    },
  ],
});
