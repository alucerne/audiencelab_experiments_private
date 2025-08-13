// DEPRECATED: This file is now a re-export from the unified field catalog
// Use ~/lib/unifiedFieldCatalog.ts instead

import { FIELD_CATALOG_V1, FIELD_EXPR_MAP_V1 } from '~/lib/unifiedFieldCatalog';

// Backward compatibility exports
export const FILTER_ATTRIBUTES = FIELD_CATALOG_V1;
export const FILTER_ATTR_EXPR_MAP = FIELD_EXPR_MAP_V1;

// Legacy exports for backward compatibility
export const EVENT_FIELDS = FIELD_CATALOG_V1.filter(f => f.group === 'pixel_event' && !f.key.includes('.'));
export const EVENT_DATA_FIELDS = FIELD_CATALOG_V1.filter(f => f.group === 'pixel_event' && f.key.includes('event_data.'));
export const RESOLUTION_FIELDS = FIELD_CATALOG_V1.filter(f => f.key.startsWith('resolution.'));
export const SOURCE_JSON_COLUMNS = FIELD_CATALOG_V1.filter(f => f.type === 'json'); 