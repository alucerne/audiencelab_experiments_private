import { Path, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
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

  // Helper function to check if a value exists in the notNulls array
  const hasValue = (value: string) => notNulls.includes(value);

  // Helper function to toggle values in the notNulls array
  const toggleValue = (value: string, checked: boolean) => {
    const currentValues = [...notNulls];

    if (checked && !currentValues.includes(value)) {
      // Add the value
      setValue('filters.notNulls', [...currentValues, value]);
    } else if (!checked && currentValues.includes(value)) {
      // Remove the value
      setValue(
        'filters.notNulls',
        currentValues.filter((item) => item !== value),
      );
    }
  };

  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>Emails</CardTitle>
        <CardDescription>
          What emails do you need from your audience?
        </CardDescription>
      </CardHeader>
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
                Include validated personal email addresses.
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
