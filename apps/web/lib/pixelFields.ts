/**
 * @deprecated This file is deprecated. Use ~/lib/unifiedFieldCatalog.ts instead.
 * This file contains hardcoded JSON extractions that are now handled by the unified field catalog.
 * 
 * The unified field catalog provides:
 * - Centralized field definitions
 * - Dynamic JSON extraction handling
 * - Better type safety and validation
 * - Consistent field mapping across the application
 */

// All filterable fields for pixel datasets
export const PIXEL_FILTER_FIELDS = [
  // top-level
  { name: 'pixel_id',            label: 'pixel_id',            expr: 'pixel_id' },
  { name: 'hem_sha256',          label: 'hem_sha256',          expr: 'hem_sha256' },
  { name: 'event_timestamp',     label: 'event_timestamp',     expr: "CAST(event_timestamp AS TIMESTAMP)" },
  { name: 'event_type',          label: 'event_type',          expr: 'event_type' },
  { name: 'ip_address',          label: 'ip_address',          expr: 'ip_address' },
  { name: 'activity_start_date', label: 'activity_start_date', expr: "CAST(activity_start_date AS TIMESTAMP)" },
  { name: 'activity_end_date',   label: 'activity_end_date',   expr: "CAST(activity_end_date   AS TIMESTAMP)" },

  // nested event_data.*
  { name: 'event_data.referrer',    label: 'event_data.referrer',    expr: "json_extract_string(event_data, '$.referrer')" },
  { name: 'event_data.timestamp',   label: 'event_data.timestamp',   expr: "json_extract_string(event_data, '$.timestamp')" },
  { name: 'event_data.title',       label: 'event_data.title',       expr: "json_extract_string(event_data, '$.title')" },
  { name: 'event_data.url',         label: 'event_data.url',         expr: "json_extract_string(event_data, '$.url')" },
  { name: 'event_data.percentage',  label: 'event_data.percentage',  expr: "json_extract(event_data, '$.percentage')" },

  // event_data.element.*
  { name: 'event_data.element.attributes.class', label: 'element.attributes.class', expr: "json_extract_string(event_data, '$.element.attributes.class')" },
  { name: 'event_data.element.attributes.href',  label: 'element.attributes.href',  expr: "json_extract_string(event_data, '$.element.attributes.href')" },
  { name: 'event_data.element.classes',          label: 'element.classes',          expr: "json_extract_string(event_data, '$.element.classes')" },
  { name: 'event_data.element.id',               label: 'element.id',               expr: "json_extract_string(event_data, '$.element.id')" },
  { name: 'event_data.element.tag',              label: 'element.tag',              expr: "json_extract_string(event_data, '$.element.tag')" },
  { name: 'event_data.element.text',             label: 'element.text',             expr: "json_extract_string(event_data, '$.element.text')" }
];

// Migration guide:
// Replace imports from this file with:
// import { FIELD_CATALOG_V1, FIELD_EXPR_MAP_V1 } from '~/lib/unifiedFieldCatalog';
//
// Replace PIXEL_FILTER_FIELDS usage with:
// const pixelFields = FIELD_CATALOG_V1.filter(f => f.group === 'pixel_event'); 