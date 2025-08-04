import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createCreditsService } from '~/lib/credits/credits.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    const client = getSupabaseServerClient();
    const creditsService = createCreditsService(client);

    const pricing = await creditsService.getAgencyCreditPricing({ agencyId });

    // Return pricing with default values for missing credit types
    const defaultPricing = {
      audience: 2500, // $25.00 per credit
      enrichment: 1500, // $15.00 per credit
      pixel: 1000, // $10.00 per credit
      custom_model: 5000, // $50.00 per credit
    };

    const responsePricing = {
      ...defaultPricing,
      ...pricing,
    };

    return NextResponse.json(responsePricing);
  } catch (error) {
    console.error('Error fetching agency pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agency pricing' },
      { status: 500 }
    );
  }
} 