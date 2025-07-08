import { Path, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { FormControl, FormField, FormItem, FormLabel } from '@kit/ui/form';
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

  function toggleValue(value: string, checked: boolean) {
    const currentValues = [...notNulls];

    if (checked && !currentValues.includes(value)) {
      setValue('filters.notNulls', [...currentValues, value]);
    } else if (!checked && currentValues.includes(value)) {
      setValue(
        'filters.notNulls',
        currentValues.filter((item) => item !== value),
      );
    }
  }

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="filters.notNulls"
        render={() => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs">
            <FormLabel>Personal Emails</FormLabel>
            <FormControl>
              <Switch
                checked={hasValue('PERSONAL_EMAILS_VALIDATION_STATUS')}
                onCheckedChange={(checked) =>
                  toggleValue('PERSONAL_EMAILS_VALIDATION_STATUS', checked)
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
            <FormLabel>Business Emails</FormLabel>
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
      <FormField
        control={control}
        name="filters.notNulls"
        render={() => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs">
            <FormLabel>Valid Phones</FormLabel>
            <FormControl>
              <Switch
                checked={hasValue('VALID_PHONES')}
                onCheckedChange={(checked) =>
                  toggleValue('VALID_PHONES', checked)
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
            <FormLabel>Skip Traced Wireless Phone Number</FormLabel>
            <FormControl>
              <Switch
                checked={hasValue('SKIPTRACE_WIRELESS_NUMBERS')}
                onCheckedChange={(checked) =>
                  toggleValue('SKIPTRACE_WIRELESS_NUMBERS', checked)
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
            <FormLabel>Skip Traced Wireless B2B Phone Number</FormLabel>
            <FormControl>
              <Switch
                checked={hasValue('SKIPTRACE_B2B_PHONE')}
                onCheckedChange={(checked) =>
                  toggleValue('SKIPTRACE_B2B_PHONE', checked)
                }
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
