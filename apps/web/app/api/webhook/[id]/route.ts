import { NextRequest, NextResponse } from 'next/server';

// In-memory store for webhook data
// In production, use Redis, Supabase, or a proper database
const webhookDataStore: Record<string, any[]> = {};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    
    // Initialize array if it doesn't exist
    if (!webhookDataStore[id]) {
      webhookDataStore[id] = [];
    }

    // Normalize data structure - handle both arrays and objects
    let normalizedData;
    
    if (Array.isArray(body)) {
      // If it's already an array, enrich each item
      normalizedData = body.map(item => ({
        ...item,
        _webhook_received_at: new Date().toISOString(),
        _webhook_id: id
      }));
    } else if (typeof body === 'object' && body !== null) {
      // If it's an object, check if it has numbered keys (like "0", "1", "2")
      const keys = Object.keys(body);
      const hasNumberedKeys = keys.every(key => /^\d+$/.test(key) && key !== '_webhook_received_at' && key !== '_webhook_id');
      
      if (hasNumberedKeys) {
        // Convert numbered keys object to array
        normalizedData = keys
          .filter(key => /^\d+$/.test(key))
          .map(key => ({
            ...body[key],
            _webhook_received_at: new Date().toISOString(),
            _webhook_id: id
          }));
      } else {
        // Single record object
        normalizedData = [{
          ...body,
          _webhook_received_at: new Date().toISOString(),
          _webhook_id: id
        }];
      }
    } else {
      // Fallback for other data types
      normalizedData = [{
        data: body,
        _webhook_received_at: new Date().toISOString(),
        _webhook_id: id
      }];
    }

    // Store the normalized data
    webhookDataStore[id].push(...normalizedData);

    console.log(`Webhook ${id} received data:`, normalizedData);

    return NextResponse.json({ 
      message: 'Data accepted',
      webhookId: id,
      dataCount: webhookDataStore[id].length
    });

  } catch (error) {
    console.error(`Webhook ${id} error:`, error);
    return NextResponse.json(
      { error: 'Invalid JSON data' },
      { status: 400 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const data = webhookDataStore[id] || [];
  
  return NextResponse.json({
    webhookId: id,
    dataCount: data.length,
    data: data
  });
}

// Export function to get webhook data (used by Studio)
export function getWebhookData(webhookId: string): any[] {
  return webhookDataStore[webhookId] || [];
}

// Export function to clear webhook data
export function clearWebhookData(webhookId: string): void {
  delete webhookDataStore[webhookId];
} 