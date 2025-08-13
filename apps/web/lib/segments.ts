import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Simple file-based store for dev. Replace with DB later.
export type Segment = {
  id: string;                   // seg_xxxxx
  name: string;                 // e.g., "High Intent – segment"
  parent_audience_id: string;   // your own id for the loaded dataset (or a slug)
  source_url: string;           // gs://... or https://... used to load
  format: 'csv' | 'parquet';    // how we read it
  filterTree: any;              // JSON from QueryBuilder
  selectedFields: string[];     // visible columns chosen in Milestone 2
  created_at: string;
  created_by?: string;
};

// File path for storing segments
const SEGMENTS_FILE = join(process.cwd(), '.segments.json');

// Load segments from file
function loadSegments(): Record<string, Segment> {
  try {
    if (existsSync(SEGMENTS_FILE)) {
      const data = readFileSync(SEGMENTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading segments:', error);
  }
  return {};
}

// Save segments to file
function saveSegments(segments: Record<string, Segment>) {
  try {
    writeFileSync(SEGMENTS_FILE, JSON.stringify(segments, null, 2));
  } catch (error) {
    console.error('Error saving segments:', error);
  }
}

// Initialize segments from file
let SEGMENTS: Record<string, Segment> = loadSegments();
let segmentCounter = Object.keys(SEGMENTS).length;

function newId() {
  // Use a counter-based approach to avoid hydration mismatches
  segmentCounter++;
  return `seg_${segmentCounter.toString().padStart(6, '0')}`;
}

export function createSegment(input: Omit<Segment, 'id' | 'created_at'>): Segment {
  const id = newId();
  const created_at = new Date().toISOString();
  const seg: Segment = { id, created_at, ...input };
  SEGMENTS[id] = seg;
  
  // Save to file immediately
  saveSegments(SEGMENTS);
  
  return seg;
}

export function listSegments(parent_audience_id?: string): Segment[] {
  // Reload from file to get latest data
  SEGMENTS = loadSegments();
  
  const all = Object.values(SEGMENTS);
  const filtered = parent_audience_id ? all.filter(s => s.parent_audience_id === parent_audience_id) : all;
  
  return filtered;
}

export function getSegment(id: string): Segment | undefined {
  // Reload from file to get latest data
  SEGMENTS = loadSegments();
  
  const segment = SEGMENTS[id];
  return segment;
} 