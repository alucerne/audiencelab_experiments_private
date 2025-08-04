import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createAudienceService } from '~/lib/audience/audience.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Temporary mock data for testing
    const mockAudiences = [
      {
        id: 'studio-test-audience-001',
        name: 'Studio Test Audience - Tech Companies',
        created_at: '2024-08-04T10:00:00Z',
        account_id: accountId,
      },
      {
        id: 'studio-test-audience-002',
        name: 'Studio Test Audience - AI Companies',
        created_at: '2024-08-04T09:00:00Z',
        account_id: accountId,
      },
      {
        id: 'studio-test-audience-003',
        name: 'Studio Test Audience - SaaS Companies',
        created_at: '2024-08-04T08:00:00Z',
        account_id: accountId,
      }
    ];

    return NextResponse.json({
      audiences: mockAudiences,
      count: mockAudiences.length,
    });

    // TODO: Uncomment this when database is working
    /*
    const client = getSupabaseServerClient();
    const audienceService = createAudienceService(client);

    const audiences = await audienceService.getAudience({ accountId });

    return NextResponse.json({
      audiences: audiences.data,
      count: audiences.count,
    });
    */
  } catch (error) {
    console.error('Error fetching audiences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audiences' },
      { status: 500 }
    );
  }
} 