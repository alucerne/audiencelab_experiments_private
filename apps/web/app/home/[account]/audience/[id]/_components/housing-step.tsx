import { Path } from 'react-hook-form';

import { AudienceFiltersFormValues } from '~/lib/audience/schema/audience-filters-form.schema';

import FilterTable from './filters-table';

export const housingFields = [
  'filters.profile.homeowner',
  'filters.attributes.dwelling_type',
  'filters.attributes.home_year_built',
  'filters.attributes.home_purchase_price',
  'filters.attributes.home_purchase_year',
  'filters.attributes.home_heat',
  'filters.attributes.home_swimming_pool',
  'filters.attributes.home_aircon',
  'filters.attributes.home_sewer',
  'filters.attributes.home_water',
  'filters.attributes.estimated_home_value',
  'filters.attributes.sales_transaction_type',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

export default function HousingStep() {
  return (
    <FilterTable
      fields={housingFields}
      fieldTypeOptions={fieldTypeOptions}
      fieldOptions={fieldOptions}
    />
  );
}

const fieldTypeOptions: Array<{
  value: (typeof housingFields)[number];
  label: string;
}> = [
  {
    value: 'filters.profile.homeowner',
    label: 'Homeowner Status BACKEND',
  },
  {
    value: 'filters.attributes.dwelling_type',
    label: 'Dwelling Type',
  },
  {
    value: 'filters.attributes.home_year_built',
    label: 'Year Built',
  },
  {
    value: 'filters.attributes.home_purchase_price',
    label: 'Purchase Price',
  },
  {
    value: 'filters.attributes.home_purchase_year',
    label: 'Purchase Year',
  },
  {
    value: 'filters.attributes.home_heat',
    label: 'Heating Type BACKEND',
  },
  {
    value: 'filters.attributes.home_swimming_pool',
    label: 'Swimming Pool BACKEND',
  },
  {
    value: 'filters.attributes.home_aircon',
    label: 'Air Conditioning BACKEND',
  },
  {
    value: 'filters.attributes.home_sewer',
    label: 'Sewer Type BACKEND',
  },
  {
    value: 'filters.attributes.home_water',
    label: 'Water Type',
  },
  {
    value: 'filters.attributes.estimated_home_value',
    label: 'Estimated Home Value BACKEND',
  },
  {
    value: 'filters.attributes.sales_transaction_type',
    label: 'Sales Transaction Type',
  },
];

const fieldOptions: Partial<Record<(typeof housingFields)[number], string[]>> =
  {
    'filters.profile.homeowner': [
      'probable homeowner 90-100',
      'homeowner',
      'renter',
    ],
    'filters.attributes.dwelling_type': ['multi-family', 'single-family'],
    'filters.attributes.home_year_built': [
      '1950 before (1950-)',
      '1950 - 1970',
      '1971 - 1990',
      '1990 after (1950+)',
    ],
    'filters.attributes.estimated_home_value': [
      '$1,000 - $24,999',
      '$25,000 - $49,999',
      '$50,000 - $74,999',
      '$75,000 - $99,999',
      '$100,000 - $124,999',
      '$125,000 - $149,999',
      '$150,000 - $174,999',
      '$175,000 - $199,999',
      '$200,000 - $224,999',
      '$225,000 - $249,999',
      '$250,000 - $274,999',
      '$275,000 - $299,999',
      '$300,000 - $349,999',
      '$350,000 - $399,999',
      '$400,000 - $449,999',
      '$450,000 - $499,999',
      '$500,000 - $749,999',
      '$750,000 - $999,999',
      '$1,000,000 plus',
    ],
  };
