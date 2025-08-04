'use server';

import { z } from 'zod';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { enhanceAction } from '@kit/next/actions';
import { createCreditsService } from '~/lib/credits/credits.service';

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
    const creditsService = createCreditsService(adminClient);

    try {
      const result = await creditsService.purchaseOverageCredits({
        clientId,
        agencyId,
        purchases,
      });

      return {
        success: true,
        message: `Successfully added ${result.totalCredits} credits to your account.`,
        totalCost: result.totalCost,
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