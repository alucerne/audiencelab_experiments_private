import { Path } from 'react-hook-form';

import { AudienceFiltersFormValues } from '~/lib/audience/schema/audience-filters-form.schema';

import FilterTable from './filters-table';

export const lifestyleFields = [
  'filters.attributes.interests_pets',
  'filters.attributes.interests_cats',
  'filters.attributes.interests_dogs',
  'filters.attributes.donate_conservative',
  'filters.attributes.donate_liberal',
  'filters.attributes.donate_political',
  'filters.attributes.donate_veterans',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

export default function LifestyleStep() {
  return (
    <FilterTable
      fields={lifestyleFields}
      fieldTypeOptions={fieldTypeOptions}
      fieldOptions={fieldOptions}
    />
  );
}

const fieldTypeOptions: Array<{
  value: (typeof lifestyleFields)[number];
  label: string;
}> = [
  {
    value: 'filters.attributes.interests_pets',
    label: 'Pets',
  },
  {
    value: 'filters.attributes.interests_cats',
    label: 'Cats',
  },
  {
    value: 'filters.attributes.interests_dogs',
    label: 'Dogs',
  },
  {
    value: 'filters.attributes.donate_conservative',
    label: 'Conservative Donations',
  },
  {
    value: 'filters.attributes.donate_liberal',
    label: 'Liberal Donations',
  },
  {
    value: 'filters.attributes.donate_political',
    label: 'Political Donations',
  },
  {
    value: 'filters.attributes.donate_veterans',
    label: 'Veterans Donations',
  },
] as const;

const fieldOptions: Partial<
  Record<(typeof lifestyleFields)[number], string[]>
> = {};
