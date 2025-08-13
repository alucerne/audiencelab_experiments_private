/*
Minimal billing configuration for experimental deployment
This avoids any external dependencies or validation
*/
export default {
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
              type: 'flat',
            },
          ],
        },
      ],
      features: ['Basic features'],
    },
  ],
};
