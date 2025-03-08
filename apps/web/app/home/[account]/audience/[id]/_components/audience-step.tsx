import { useCallback, useEffect, useRef } from 'react';

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
import { Input } from '@kit/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@kit/ui/toggle-group';

import AsyncMultiSelect from '~/components/ui/async-multi-select';
import CreatableInput from '~/components/ui/creatable-input';
import {
  AudienceFiltersFormValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';

import { searchPremadeListsAction } from '../_lib/server-actions';

export const audienceFields = [
  'audience',
  'segment',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

export default function AudienceStep() {
  const { control, watch, resetField } =
    useFormContext<z.infer<typeof audienceFiltersFormSchema>>();

  const audienceType = watch('audience.type');
  const b2b = watch('audience.b2b');

  const previousAudienceTypeRef = useRef(audienceType);

  useEffect(() => {
    if (previousAudienceTypeRef.current !== audienceType) {
      resetField('segment');
      resetField('audience.customTopic');
      resetField('audience.customDescription');
      previousAudienceTypeRef.current = audienceType;
    }
  }, [audienceType, resetField]);

  const searchWithBusinessType = useCallback(
    (search: string) =>
      searchPremadeListsAction({
        search,
        b2b,
      }),
    [b2b],
  );

  return (
    <>
      <FormField
        control={control}
        name="audience.type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Audience Method</FormLabel>
            <FormDescription>
              Select the method you want to use to create your audience.
            </FormDescription>
            <FormControl>
              <ToggleGroup
                type="single"
                variant="outline"
                value={field.value}
                onValueChange={(value) => {
                  if (value) {
                    field.onChange(value);
                  }
                }}
                className="mt-1.5 justify-start"
              >
                <ToggleGroupItem value="premade" className="px-3 py-1">
                  Premade
                </ToggleGroupItem>
                <ToggleGroupItem value="keyword" className="px-3 py-1">
                  Keyword
                </ToggleGroupItem>
                <ToggleGroupItem value="custom" className="px-3 py-1" disabled>
                  Custom
                </ToggleGroupItem>
              </ToggleGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="audience.b2b"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Type</FormLabel>
            <FormDescription>
              Select the type of business you are targeting.
            </FormDescription>
            <FormControl>
              <ToggleGroup
                type="single"
                variant="outline"
                value={field.value ? 'B2B' : 'B2C'}
                onValueChange={(value) => {
                  if (value) {
                    field.onChange(value === 'B2B');
                  }
                }}
                className="mt-1.5 justify-start"
              >
                <ToggleGroupItem value="B2B" className="px-3 py-1">
                  B2B
                </ToggleGroupItem>
                <ToggleGroupItem value="B2C" className="px-3 py-1">
                  B2C
                </ToggleGroupItem>
              </ToggleGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {audienceType === 'premade' ? (
        <FormField
          control={control}
          name="segment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What interests does your audience have?</FormLabel>
              <FormDescription>
                Search and select a premade list.
              </FormDescription>
              <FormControl>
                <AsyncMultiSelect
                  value={field.value}
                  onChange={(selected) => field.onChange(selected)}
                  searchAction={searchWithBusinessType}
                  debounceTime={500}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : audienceType === 'keyword' ? (
        <FormField
          control={control}
          name="segment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What interests does your audience have?</FormLabel>
              <FormDescription>
                Build your own audience based on search terms.
              </FormDescription>
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
      ) : audienceType === 'custom' ? (
        <>
          <FormField
            control={control}
            name="audience.customTopic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic</FormLabel>
                <FormDescription>
                  What is the topic of your custom audience?
                </FormDescription>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="audience.customDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormDescription>
                  Describe your custom audience.
                </FormDescription>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : null}
    </>
  );
}
