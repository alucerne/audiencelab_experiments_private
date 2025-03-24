import { Path, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@kit/ui/form';
import { Switch } from '@kit/ui/switch';

import {
  AudienceFiltersFormValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';

export const emailsFields = [
  'filters.notNulls',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

export default function EmailsStep() {
  const { control, watch, setValue } =
    useFormContext<z.infer<typeof audienceFiltersFormSchema>>();

  const notNulls = watch('filters.notNulls') || [];

  const hasValue = (value: string) => notNulls.includes(value);

  function toggleValue (value: string, checked: boolean) {
    const currentValues = [...notNulls];

    if (checked && !currentValues.includes(value)) {
      setValue('filters.notNulls', [...currentValues, value]);
    } else if (!checked && currentValues.includes(value)) {
      setValue(
        'filters.notNulls',
        currentValues.filter((item) => item !== value),
      );
    }
  };

  return (
    <>
      <FormField
        control={control}
        name="filters.notNulls"
        render={() => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs">
            <div className="space-y-0.5">
              <FormLabel>Personal Emails</FormLabel>
              <FormDescription>
                Include validated personal email addresses.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={hasValue('PERSONAL_EMAILS')}
                onCheckedChange={(checked) =>
                  toggleValue('PERSONAL_EMAILS', checked)
                }
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="filters.notNulls"
        render={() => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs">
            <div className="space-y-0.5">
              <FormLabel>Business Emails</FormLabel>
              <FormDescription>
                Include validated business email addresses.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={hasValue('BUSINESS_EMAIL')}
                onCheckedChange={(checked) =>
                  toggleValue('BUSINESS_EMAIL', checked)
                }
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
}
