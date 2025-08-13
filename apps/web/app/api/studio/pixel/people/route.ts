import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For Vercel deployment, return mock data
    const mockData = {
      people: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ],
      total: 2
    };

    return NextResponse.json({
      success: true,
      data: mockData,
      note: 'Mock data returned for Vercel deployment'
    });

  } catch (error) {
    console.error('Error fetching pixel people:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pixel people', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 