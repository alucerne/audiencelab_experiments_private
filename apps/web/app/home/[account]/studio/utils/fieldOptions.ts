// utils/fieldOptions.ts
export const FIELD_TYPES = [
  { key: 'text', label: 'Text' },
  { key: 'email', label: 'Email' },
  { key: 'url', label: 'URL' },
  { key: 'checkbox', label: 'Checkbox' },
  { key: 'select', label: 'Select' },
  { key: 'date', label: 'Date' },
  { key: 'code', label: '🧠 Custom Code' },
];

export interface CustomColumn {
  field: string;
  headerName: string;
  type: string;
  apiEndpoint?: string;
  apiMethod?: 'GET' | 'POST';
  apiParams?: Record<string, any>;
  transform?: string;
  sourceField?: string;
} 