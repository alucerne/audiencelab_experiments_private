import { Path, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Slider } from '@kit/ui/slider';

import {
  AudienceFiltersFormValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';

export const dateFields = [
  'audience.dateRange',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

export default function DateStep() {
  const { control } =
    useFormContext<z.infer<typeof audienceFiltersFormSchema>>();

  return (
    <FormField
      control={control}
      name="audience.dateRange"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Current Date Range: {field.value ?? '—'}</FormLabel>
          <FormControl>
            <div className="space-y-2">
              <Slider
                min={2}
                max={10}
                step={1}
                value={[field.value ?? 7]}
                onValueChange={(vals) => {
                  field.onChange(vals[0]);
                }}
              />
              <div className="flex justify-between">
                <span className="text-sm">2 days</span>
                <span className="text-sm">10 days</span>
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
