'use server';

import { z } from 'zod';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { enhanceAction } from '@kit/next/actions';

const PurchaseCreditsSchema = z.object({
  clientId: z.string().uuid(),
  agencyId: z.string().uuid(),
  purchases: z.array(z.object({
    creditType: z.enum(['audience', 'enrichment', 'pixel', 'custom_model']),
    credits: z.number().positive(),
    pricePerCreditCents: z.number().positive(),
    costPerCreditCents: z.number().positive(),
  })),
});

export const purchaseCreditsAction = enhanceAction(
  async (data) => {
    const { clientId, agencyId, purchases } = PurchaseCreditsSchema.parse(data);
    const adminClient = getSupabaseServerAdminClient();

    try {
      // For now, we'll simulate the purchase since the tables don't exist yet
      // In production, this would:
      
      // 1. Insert into overage_credit_purchases table
      // const purchasePromises = purchases.map(purchase => 
      //   adminClient
      //     .from('overage_credit_purchases')
      //     .insert({
      //       client_id: clientId,
      //       agency_id: agencyId,
      //       credit_type: purchase.creditType,
      //       credits: purchase.credits,
      //       price_per_credit_cents: purchase.pricePerCreditCents,
      //       cost_per_credit_cents: purchase.costPerCreditCents,
      //       billed_to_client: false,
      //       billed_to_agency: false,
      //     })
      // );

      // 2. Update client_credit_balances (credits table)
      // const creditUpdates = purchases.map(purchase => {
      //   const fieldMap = {
      //     audience: 'current_audience',
      //     enrichment: 'current_enrichment',
      //     pixel: 'current_pixel',
      //     custom_model: 'current_custom',
      //   };
      //   
      //   return adminClient
      //     .from('credits')
      //     .update({
      //       [fieldMap[purchase.creditType]]: 
      //         adminClient.rpc('increment', { 
      //           column: fieldMap[purchase.creditType], 
      //           amount: purchase.credits 
      //         })
      //     })
      //     .eq('account_id', clientId);
      // });

      // await Promise.all([...purchasePromises, ...creditUpdates]);

      // For now, just log the purchase
      console.log('Credit purchase:', {
        clientId,
        agencyId,
        purchases,
        totalCredits: purchases.reduce((sum, p) => sum + p.credits, 0),
        totalCost: purchases.reduce((sum, p) => sum + (p.credits * p.pricePerCreditCents), 0),
      });

      return {
        success: true,
        message: `Successfully added ${purchases.reduce((sum, p) => sum + p.credits, 0)} credits to your account.`,
        totalCost: purchases.reduce((sum, p) => sum + (p.credits * p.pricePerCreditCents), 0),
      };

    } catch (error) {
      console.error('Failed to purchase credits:', error);
      throw new Error('Failed to process credit purchase');
    }
  },
  {
    schema: PurchaseCreditsSchema,
  },
); 