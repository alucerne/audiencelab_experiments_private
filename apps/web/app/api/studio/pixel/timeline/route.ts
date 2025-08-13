import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For Vercel deployment, return mock data
    const mockData = {
      timeline: [
        { date: '2024-01-01', events: 10 },
        { date: '2024-01-02', events: 15 },
        { date: '2024-01-03', events: 8 }
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockData,
      note: 'Mock data returned for Vercel deployment'
    });

  } catch (error) {
    console.error('Error fetching pixel timeline:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pixel timeline', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 