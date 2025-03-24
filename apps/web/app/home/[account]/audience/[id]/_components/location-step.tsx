import { Path, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';

import CreatableInput from '~/components/ui/creatable-input';
import MultiSelect from '~/components/ui/multi-select';
import {
  AudienceFiltersFormValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';

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
            <FormLabel>Cities BACKEND</FormLabel>
            <FormControl>
              <CreatableInput
                value={field.value}
                onChange={(newValue) => field.onChange(newValue)}
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
            <FormLabel>States BACKEND</FormLabel>
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
            <FormLabel>Zip Codes BACKEND</FormLabel>
            <FormControl>
              <CreatableInput
                value={field.value.map((val) => val.toString())}
                onChange={(newValue) =>
                  field.onChange(newValue.map((val) => parseInt(val, 10)))
                }
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
