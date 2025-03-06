import { useCallback, useState } from 'react';

import { Path, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { ToggleGroup, ToggleGroupItem } from '@kit/ui/toggle-group';

import AsyncMultiSelect from '~/components/ui/async-multi-select';
import {
  AudienceFiltersFormValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';

import { searchPremadeListsAction } from '../_lib/server-actions';

export const premadeFields = [
  'segment',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

export default function PremadeStep() {
  const { control } =
    useFormContext<z.infer<typeof audienceFiltersFormSchema>>();

  const [businessType, setBusinessType] = useState<'B2B' | 'B2C'>('B2B');

  const searchWithBusinessType = useCallback(
    (search: string) => searchPremadeListsAction({ search, businessType }),
    [businessType],
  );

  return (
    <>
      <FormItem>
        <FormLabel>Business Type</FormLabel>
        <FormDescription>
          Select the type of business you are targeting.
        </FormDescription>
        <ToggleGroup
          type="single"
          variant="outline"
          value={businessType}
          onValueChange={(value) =>
            value && setBusinessType(value as 'B2B' | 'B2C')
          }
          className="mt-1.5 justify-start"
        >
          <ToggleGroupItem value="B2B" className="px-3 py-1">
            B2B
          </ToggleGroupItem>
          <ToggleGroupItem value="B2C" className="px-3 py-1">
            B2C
          </ToggleGroupItem>
        </ToggleGroup>
      </FormItem>
      <FormField
        control={control}
        name="segment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              What kind of interests does your audience have?
            </FormLabel>
            <FormDescription>Search and select a premade list.</FormDescription>
            <FormControl>
              <AsyncMultiSelect
                value={field.value}
                onChange={(selected) => field.onChange(selected)}
                searchAction={searchWithBusinessType}
                className="w-full"
                debounceTime={500}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
