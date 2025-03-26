import { Path, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';

import AsyncMultiSelect from '~/components/ui/async-multi-select';
import MultiSelect from '~/components/ui/multi-select';
import {
  AudienceFiltersFormValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';
import {
  searchBatchZipsAction,
  searchCitiesAction,
  searchZipsAction,
} from '~/lib/audience/server-actions';

export const locationFields = [
  'filters.city',
  'filters.state',
  'filters.zip',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

export default function LocationStep() {
  const { control } =
    useFormContext<z.infer<typeof audienceFiltersFormSchema>>();

  return (
    <>
      <FormField
        control={control}
        name="filters.city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cities</FormLabel>
            <FormControl>
              <AsyncMultiSelect
                value={field.value}
                onChange={(selected) => field.onChange(selected)}
                searchAction={(search) => searchCitiesAction({ search })}
                debounceTime={500}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="filters.state"
        render={({ field }) => (
          <FormItem>
            <FormLabel>States</FormLabel>
            <FormControl>
              <MultiSelect
                options={states}
                value={field.value}
                onChange={(selected) => field.onChange(selected)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="filters.zip"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zip Codes</FormLabel>
            <FormControl>
              <AsyncMultiSelect
                value={field.value}
                onChange={(selected) => field.onChange(selected)}
                searchAction={(search) => searchZipsAction({ search })}
                batchSearchAction={(searchTerms) =>
                  searchBatchZipsAction({ search: searchTerms })
                }
                debounceTime={500}
                placeholder="Type to search, or enter multiple zip codes separated by commas..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

const states = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];
