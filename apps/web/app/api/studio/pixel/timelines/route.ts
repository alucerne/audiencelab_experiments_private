import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy') || 'hour';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Dummy data for timeline insights
    const dummyData = [
      {
        time_period: '2025-01-20 14:00',
        event_count: 45,
        unique_users: 23,
        page_views: 32,
        clicks: 13,
        conversions: 2
      },
      {
        time_period: '2025-01-20 15:00',
        event_count: 67,
        unique_users: 38,
        page_views: 48,
        clicks: 19,
        conversions: 4
      },
      {
        time_period: '2025-01-20 16:00',
        event_count: 89,
        unique_users: 52,
        page_views: 61,
        clicks: 28,
        conversions: 7
      },
      {
        time_period: '2025-01-20 17:00',
        event_count: 123,
        unique_users: 71,
        page_views: 89,
        clicks: 34,
        conversions: 12
      },
      {
        time_period: '2025-01-20 18:00',
        event_count: 156,
        unique_users: 94,
        page_views: 112,
        clicks: 44,
        conversions: 18
      }
    ];

    // Apply pagination
    const paginatedData = dummyData.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      groupBy,
      pagination: {
        limit,
        offset,
        total: dummyData.length
      }
    });

  } catch (error) {
    console.error('Error fetching timeline data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline data' },
      { status: 500 }
    );
  }
} 