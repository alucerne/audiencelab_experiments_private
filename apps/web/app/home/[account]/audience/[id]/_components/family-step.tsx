import { Path } from 'react-hook-form';

import { AudienceFiltersFormValues } from '~/lib/audience/schema/audience-filters-form.schema';

import FilterTable from './filters-table';

export const familyFields = [
  'filters.profile.married',
  'filters.attributes.marital_status',
  'filters.attributes.single_parent',
  'filters.attributes.generations_in_household',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

export default function FamilyStep() {
  return (
    <FilterTable
      fields={familyFields}
      fieldTypeOptions={fieldTypeOptions}
      fieldOptions={fieldOptions}
    />
  );
}

const fieldTypeOptions: Array<{
  value: (typeof familyFields)[number];
  label: string;
}> = [
  {
    value: 'filters.profile.married',
    label: 'Married',
  },
  {
    value: 'filters.attributes.marital_status',
    label: 'Marital Status',
  },
  {
    value: 'filters.attributes.single_parent',
    label: 'Single Parent',
  },
  {
    value: 'filters.attributes.generations_in_household',
    label: 'Generations in Household',
  },
] as const;

const fieldOptions: Partial<Record<(typeof familyFields)[number], string[]>> = {
  'filters.profile.married': ['yes', 'no'],
  'filters.attributes.marital_status': [
    'inferred married',
    'inferred single',
    'married',
    'single',
  ],
  'filters.attributes.single_parent': ['yes', 'no'],
  'filters.attributes.generations_in_household': ['1', '2', '3'],
};
