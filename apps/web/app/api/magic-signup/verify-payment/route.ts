import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createStripeClient } from '../../../../../../packages/billing/stripe/src/services/stripe-sdk';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

const VerifyPaymentSchema = z.object({
  sessionId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = VerifyPaymentSchema.parse(body);

    // Check if this is a mock session
    if (sessionId.startsWith('mock_session_')) {
      console.log('Mock payment session detected, returning mock success');
      return NextResponse.json({
        success: true,
        sessionId: sessionId,
        paymentStatus: 'paid',
        amount: 2235500, // Mock amount
        currency: 'usd',
        paymentIntent: 'mock_payment_intent_' + Date.now(),
        customer: 'mock_customer_' + Date.now(),
        created: Math.floor(Date.now() / 1000),
        isMock: true,
      });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = await createStripeClient();
    const adminClient = getSupabaseServerAdminClient();

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get the customer email from metadata or session
    const customerEmail = session.customer_email || 
      (session.customer && typeof session.customer === 'object' && 'email' in session.customer 
        ? session.customer.email 
        : null);

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    // Find the account by email
    const { data: account, error: accountError } = await adminClient
      .from('accounts')
      .select('id, email')
      .eq('email', customerEmail)
      .maybeSingle();

    if (!account || accountError) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Update the account with Stripe customer information
    const updateData: any = {
      stripe_customer_id: session.customer,
    };

    // If this is a customer object, get the ID
    if (session.customer && typeof session.customer === 'object' && 'id' in session.customer) {
      updateData.stripe_customer_id = session.customer.id;
    }

    const { error: updateError } = await adminClient
      .from('accounts')
      .update(updateData)
      .eq('id', account.id);

    if (updateError) {
      console.error('Error updating account with Stripe customer ID:', updateError);
      // Don't fail the request, just log the error
    }

    // Return session data for the success page
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amount: session.amount_total,
      currency: session.currency,
      paymentIntent: session.payment_intent,
      customer: session.customer,
      created: session.created,
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 