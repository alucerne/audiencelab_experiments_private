/**
 * @deprecated This file is deprecated. Use ~/lib/unifiedFieldCatalog.ts instead.
 * This file contains hardcoded JSON extractions that are now handled by the unified field catalog.
 */

export const URL_FROM_EVENT = `json_extract_string(event_data, '$.url')`;

// Migration guide:
// Replace imports from this file with:
// import { FIELD_EXPR_MAP_V1 } from '~/lib/unifiedFieldCatalog';
//
// Replace URL_FROM_EVENT usage with:
// const urlExpr = FIELD_EXPR_MAP_V1['event_data.url'];

export const UTM_EXTRACTS = `
  REGEXP_EXTRACT(${URL_FROM_EVENT}, '[?&]utm_source=([^&#]+)', 1) AS utm_source,
  REGEXP_EXTRACT(${URL_FROM_EVENT}, '[?&]utm_medium=([^&#]+)', 1) AS utm_medium,
  REGEXP_EXTRACT(${URL_FROM_EVENT}, '[?&]utm_campaign=([^&#]+)', 1) AS utm_campaign,
  REGEXP_EXTRACT(${URL_FROM_EVENT}, '[?&]utm_content=([^&#]+)', 1) AS utm_content,
  REGEXP_EXTRACT(${URL_FROM_EVENT}, '[?&]utm_term=([^&#]+)', 1) AS utm_term
`; 