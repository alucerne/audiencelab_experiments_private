import { Path, useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';

import MultiSelect from '~/components/ui/multi-select';
import { RangeInput } from '~/components/ui/range-input';
import { AudienceFiltersFormValue } from '~/lib/audience/schema/audience-filters-form.schema';
import { isRangeInput } from '~/lib/audience/utils';

type FormValues = Record<string, AudienceFiltersFormValue>;

export default function DynamicField<T extends FormValues>({
  fieldName,
  options = [],
}: {
  fieldName: Path<T>;
  options?: string[];
}) {
  const { control } = useFormContext<T>();

  return (
    <FormField
      key={fieldName}
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="w-full">
          {isRangeInput(field.value) ? (
            <FormControl>
              <RangeInput
                value={field.value}
                onChange={(newRange) => {
                  field.onChange(newRange);
                }}
              />
            </FormControl>
          ) : (
            <>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <MultiSelect
                  options={options}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
            </>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
