import { NextResponse } from 'next/server';
import { FIELD_CATALOG_V1 } from '~/lib/unifiedFieldCatalog';

export async function GET() {
  try {
    // Group fields by their group for easier consumption
    const pixelEvents = FIELD_CATALOG_V1.filter(field => field.group === 'pixel_event');
    const contactData = FIELD_CATALOG_V1.filter(field => field.group === 'contact');

    return NextResponse.json({
      catalog: "v1",
      totalFields: FIELD_CATALOG_V1.length,
      fields: FIELD_CATALOG_V1,
      groups: {
        pixel_event: {
          count: pixelEvents.length,
          fields: pixelEvents
        },
        contact: {
          count: contactData.length,
          fields: contactData
        }
      },
      metadata: {
        version: "1.0.0",
        description: "Unified field catalog for Audience Studio Query + Filter stages",
        includes: [
          "Pixel Events (direct fields + JSON extraction)",
          "Contact Data (direct fields + resolution JSON extraction)",
          "All field types: string, number, timestamp, boolean, json"
        ]
      }
    });
  } catch (error) {
    console.error('Error serving field catalog:', error);
    return NextResponse.json(
      { 
        error: 'Failed to serve field catalog',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 