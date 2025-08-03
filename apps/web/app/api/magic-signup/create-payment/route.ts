import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createStripeCheckout } from '../../../../../../packages/billing/stripe/src/services/create-stripe-checkout';
import { createStripeClient } from '../../../../../../packages/billing/stripe/src/services/stripe-sdk';

const CreatePaymentSchema = z.object({
  amountCents: z.number().positive(),
  agencyId: z.string().uuid(),
  planId: z.string().min(1), // Changed from UUID to any string (signup code)
  accountData: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amountCents, agencyId, planId, accountData } = CreatePaymentSchema.parse(body);

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      // Mock response for development
      console.log('Stripe not configured, returning mock payment session');
      return NextResponse.json({
        success: true,
        checkoutToken: 'mock_checkout_token_' + Date.now(),
        sessionId: 'mock_session_' + Date.now(),
        isMock: true,
      });
    }

    const stripe = await createStripeClient();

    // Create a one-time payment checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Client Plan Setup',
              description: 'One-time setup fee for client plan',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      customer_email: accountData.email,
      client_reference_id: agencyId,
      metadata: {
        agencyId,
        planId,
        accountEmail: accountData.email,
        paymentType: 'magic_signup_setup',
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/signup-magic/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/signup-magic?agency_id=${agencyId}&amount_cents=${amountCents}&plan_id=${planId}`,
      payment_method_collection: 'always',
      customer_creation: 'always',
    });

    return NextResponse.json({
      success: true,
      checkoutToken: session.client_secret,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
} 