import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import SingleSelect from '~/components/ui/single-select';
import { NewSyncFormSchema } from '~/lib/integration-app/schema/new-sync-form.schema';

import { useSheetTabs } from '../_lib/hooks/google-sheets/use-sheet-tabs';
import { useSpreadsheets } from '../_lib/hooks/google-sheets/use-spreadsheets';

export default function GoogleSheetsStep() {
  const { control, setValue } =
    useFormContext<z.infer<typeof NewSyncFormSchema>>();

  const spreadsheetId = useWatch({
    control,
    name: 'integration.googleSheetsSpreadsheetId',
  });

  const { spreadsheets, isLoading: loadingSpreadsheets } = useSpreadsheets({
    enabled: true,
  });

  const { sheetTabs: sheets, isLoading: loadingSheets } = useSheetTabs({
    enabled: Boolean(spreadsheetId),
    spreadsheetId,
  });

  return (
    <>
      <FormField
        control={control}
        name="integration.googleSheetsSpreadsheetId"
        render={({ field }) => {
          const sheets = spreadsheets ?? [];
          const selectedId = field.value ?? '';

          return (
            <FormItem>
              <FormLabel>Select Spreadsheet</FormLabel>
              <SingleSelect
                options={sheets.map((s) => s.name)}
                value={sheets.find((s) => s.id === selectedId)?.name ?? ''}
                onChange={(name) => {
                  const spreadsheet = sheets.find((s) => s.name === name);
                  field.onChange(spreadsheet?.id);
                  setValue(
                    'integration.googleSheetsSpreadsheetName',
                    spreadsheet?.name ?? '',
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  );
                }}
                disabled={loadingSpreadsheets}
                placeholder={
                  loadingSpreadsheets
                    ? 'Loading spreadsheets...'
                    : 'Choose a spreadsheet'
                }
              />
              <FormMessage />
            </FormItem>
          );
        }}
      />
      <FormField
        control={control}
        name="integration.googleSheetsSheetId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Sheet (Tab)</FormLabel>
            <FormControl>
              <Select
                key={`${field.value}_${sheets?.length}`}
                onValueChange={(value) => {
                  field.onChange(value);
                  const sheet = sheets?.find((s) => s.id === value);
                  setValue(
                    'integration.googleSheetsSheetName',
                    sheet?.name ?? '',
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  );
                }}
                value={field.value}
                disabled={!spreadsheetId || loadingSheets}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !spreadsheetId
                        ? 'Select a spreadsheet first'
                        : loadingSheets
                          ? 'Loading sheets...'
                          : 'Choose a sheet'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sheets?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                  {!sheets?.length && (
                    <SelectItem value="none" disabled>
                      No sheets found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
