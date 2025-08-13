export type PredefinedSource = {
  id: 'pixel_1' | 'audience_1';
  name: string;
  url: string;
  format: 'csv' | 'parquet';
  kind: 'pixel' | 'audience';
};

export const PREDEFINED_SOURCES: PredefinedSource[] = [
  {
    id: 'pixel_1',
    name: 'Pixel 1 (Test)',
    url: 'https://storage.googleapis.com/staging_tests_main/Pixel_Local_Test%20-%20random_contacts.csv',
    format: 'csv',
    kind: 'pixel'
  },
  {
    id: 'audience_1',
    name: 'Audience 1',
    url: 'https://storage.googleapis.com/staging_tests_main/Pixel_Local_Test%20-%20random_contacts.csv',
    format: 'csv',
    kind: 'audience'
  }
]; 