import { useEffect, useState } from 'react';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Path } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { FormControl, FormField, FormItem, FormMessage } from '@kit/ui/form';
import { Label } from '@kit/ui/label';
import { Separator } from '@kit/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import { RangeInput } from '~/components/ui/range-input';
import SingleSelect from '~/components/ui/single-select';
import {
  AudienceFiltersFormValue,
  AudienceFiltersFormValues,
} from '~/lib/audience/schema/audience-filters-form.schema';
import { formatNumberRange } from '~/lib/audience/utils';

import DynamicField from './dynamic-field';

export const personalFields = [
  'filters.age',
  'filters.gender',
  'filters.attributes.ethnicCode',
  'filters.attributes.languageCode',
  'filters.attributes.education',
  'filters.attributes.smoker',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

type PersonalFieldWithoutAge = Exclude<
  (typeof personalFields)[number],
  'filters.age'
>;

type FieldRow = {
  fieldName: PersonalFieldWithoutAge;
  fieldValue: string;
  rawValue: AudienceFiltersFormValue;
};

export default function PersonalStep() {
  const form = useFormContext<AudienceFiltersFormValues>();
  const [tableData, setTableData] = useState<FieldRow[]>([]);

  const { control } = useFormContext<AudienceFiltersFormValues>();

  const generateTableData = () => {
    const rows: FieldRow[] = [];

    personalFields
      .filter((field) => field !== 'filters.age')
      .forEach((field) => {
        const value = form.getValues(field);

        if (value === null || value === undefined) return;

        if (Array.isArray(value)) {
          if (value.length === 0) return;

          value.forEach((item) => {
            rows.push({
              fieldName: field,
              fieldValue: item,
              rawValue: value,
            });
          });
        }
      });

    return rows;
  };

  const handleDelete = (row: FieldRow) => {
    const currentValue = form.getValues(row.fieldName);

    if (Array.isArray(currentValue)) {
      const newValue = currentValue.filter((item) => item !== row.fieldValue);
      form.setValue(row.fieldName, newValue);
    }

    setTableData(generateTableData());
  };

  useEffect(() => {
    setTableData(generateTableData());
  }, []);

  const columns: ColumnDef<FieldRow>[] = [
    {
      accessorKey: 'fieldName',
      header: 'Field',
      cell: ({ row: { original } }) => {
        const option = fieldTypeOptions.find((opt) =>
          opt.value.endsWith(original.fieldName),
        );
        return option?.label ?? original.fieldName;
      },
    },
    {
      accessorKey: 'fieldValue',
      header: 'Value',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex w-full justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="flex justify-between">
        <CardHeader className="p-0">
          <CardTitle>Personal</CardTitle>
          <CardDescription>
            What are the personal characteristics of your audience?
          </CardDescription>
        </CardHeader>
        <AddFieldValueDialog
          onClose={() => setTableData(generateTableData())}
        />
      </div>
      <FormField
        control={control}
        name="filters.age"
        render={({ field }) => (
          <FormItem className="w-full">
            <Label>Age Range</Label>
            <FormControl>
              <RangeInput
                value={{
                  min: field.value.minAge,
                  max: field.value.maxAge,
                }}
                onChange={(newRange) => {
                  field.onChange({
                    minAge: newRange.min,
                    maxAge: newRange.max,
                  });
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Separator />
      <div className="space-y-1.5">
        <Label>Filters</Label>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="capitalize">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No filters added.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
interface SelectedField {
  value: PersonalFieldWithoutAge;
  label: string;
}

function AddFieldValueDialog({ onClose }: { onClose: () => void }) {
  const [selectedField, setSelectedField] = useState<SelectedField | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialValue, setInitialValue] = useState<string[] | null>(null);
  const form = useFormContext<AudienceFiltersFormValues>();

  function handleOpenChange(open: boolean) {
    if (!open) {
      if (selectedField && initialValue !== null) {
        form.setValue(selectedField.value, initialValue);
      }

      setSelectedField(null);
      setInitialValue(null);
      onClose();
    }

    setDialogOpen(open);
  }

  async function onSubmit() {
    if (!selectedField) return;

    const isValid = await form.trigger(selectedField.value);

    if (!isValid) return;

    const values = form.getValues(selectedField.value);

    toast.success(
      `Added ${selectedField.label}: ${
        Array.isArray(values)
          ? values
              .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
              .join(', ')
          : formatNumberRange(values)
      }`,
    );

    setDialogOpen(false);
    setSelectedField(null);
    setInitialValue(null);
    onClose();
  }

  function handleFieldChange(selected: string) {
    if (selectedField && initialValue !== null) {
      form.setValue(selectedField.value, initialValue);
    }

    const newField = fieldTypeOptions.find(
      (option) => option.label === selected,
    );

    if (newField) {
      const currentValue = form.getValues(newField.value);
      setInitialValue(currentValue);
      setSelectedField(newField);
    } else {
      setSelectedField(null);
      setInitialValue(null);
    }
  }

  useEffect(() => {
    if (!dialogOpen && selectedField && initialValue !== null) {
      form.setValue(selectedField.value, initialValue);
    }
  }, [dialogOpen, selectedField, initialValue, form]);

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={() => setDialogOpen(true)}>
        <Button size="sm" className="w-fit gap-2 text-sm">
          Add <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Add Filter</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          <div className="space-y-1">
            <Label>Field</Label>
            <SingleSelect
              options={fieldTypeOptions.map((option) => option.label)}
              value={selectedField?.label ?? ''}
              onChange={handleFieldChange}
            />
          </div>
          {selectedField && (
            <DynamicField
              fieldName={selectedField.value}
              options={fieldOptions[selectedField.value]}
            />
          )}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={onSubmit}>
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const fieldTypeOptions: Array<{
  value: PersonalFieldWithoutAge;
  label: string;
}> = [
  {
    value: 'filters.gender',
    label: 'Gender',
  },
  {
    value: 'filters.attributes.ethnicCode',
    label: 'Ethnicity',
  },
  {
    value: 'filters.attributes.languageCode',
    label: 'Language',
  },
  {
    value: 'filters.attributes.education',
    label: 'Education',
  },
  {
    value: 'filters.attributes.smoker',
    label: 'Smoker',
  },
];

const fieldOptions: Partial<Record<PersonalFieldWithoutAge, string[]>> = {
  'filters.gender': ['both', 'male', 'female', 'unkown'],
  'filters.attributes.ethnicCode': [
    'afghani',
    'bengladesh',
    'indian',
    'pakistani',
    'sri lankan',
    'nepal',
    'telugan',
    'algerian',
    'arab',
    'bahrain',
    'egyptian',
    'greek',
    'iraqi',
    'kurdish',
    'jewish',
    'kuwaiti',
    'libyan',
    'macedonian',
    'moroccan',
    'qatar',
    'persian',
    'saudi',
    'syrian',
    'tunisian',
    'turkish',
    'yemeni',
    'maltese',
    'native american',
    'african american 1',
    'angolan',
    'ashanti',
    'basotho',
    'benin',
    'bhutanese',
    'burkina faso',
    'burundi',
    'cameroon',
    'cent afric rep',
    'chad',
    'comoros',
    'congo',
    'equat guinea',
    'ethiopian',
    'gabon',
    'gambia',
    'ghana',
    'guinea-bissea',
    'guyana',
    'ivory coast',
    'kenya',
    'lesotho',
    'liberian',
    'madagascar',
    'malawi',
    'mali',
    'namibian',
    'nigerian',
    'mozambique',
    'papua new guinea',
    'ruandan',
    'senegalese',
    'siere leone',
    'somalia',
    'danish',
    'dutch',
    'finnish',
    'icelandic',
    'norwegian',
    'scotch',
    'swedish',
    'welsh',
    'aleut',
    'myanmar',
    'chinese',
    'fiji',
    'hawaiian',
    'indonesian',
    'japanese',
    'khmer',
    'korean',
    'laotian',
    'malay',
    'mongolian',
    'other asian',
    'filipino',
    'thai',
    'tibetan',
    'vietnamese',
    'maldivian',
    'nauruan',
    'new zealand',
    'australian',
    'vanuatuan',
    'pili',
    'belgian',
    'basque',
    'english',
    'french',
    'german',
    'irish',
    'italian',
    'portuguese',
    'hispanic',
    'liechtenstein',
    'luxembourgian',
    'swiss',
    'manx',
    'albanian',
    'armenian',
    'austrian',
    'azerb',
    'bosnian',
    'bulgarian',
    'byelorussian',
    'chechnian',
    'croatian',
    'czech',
    'estonian',
    'georgian',
    'hungarian',
    'kazakh',
    'kirghiz',
    'kyrgyzstani',
    'latvian',
    'lithuanian',
    'moldavian',
    'polish',
    'romanian',
    'russian',
    'serbian',
    'slovakian',
    'slovenian',
    'tajikistan',
    'tajik',
    'turkmenistan',
    'ukrainian',
    'uzbekistani',
    'south african',
    'surinam',
    'sudanese',
    'swaziland',
    'tanzanian',
    'togo',
    'tonga',
    'ugandan',
    'xhosa',
    'zaire',
    'zambian',
    'zimbabwe',
    'zulu',
    'djibouti',
    'guinean',
    'mauritania',
    'niger',
    'seychelles',
    'western samoa',
    'african american 2',
    'botswanian',
    'hausa',
    'caribbean african american',
    'swahili',
    'multi-ethnic',
  ],
  'filters.attributes.languageCode': [
    'afrikaans',
    'albanian',
    'amharic',
    'arabic',
    'armenian',
    'ashanti',
    'azeri',
    'bantu',
    'basque',
    'bengali',
    'bulgarian',
    'burmese',
    'chinese (mandarin, cantonese and other dialects)',
    'comorian',
    'czech',
    'danish',
    'dutch',
    'dzongha',
    'english',
    'estonian',
    'farsi',
    'finnish',
    'french',
    'georgian',
    'german',
    'ga',
    'greek',
    'hausa',
    'hebrew',
    'hindi',
    'hungarian',
    'icelandic',
    'indonesian',
    'italian',
    'japanese',
    'kazakh',
    'khmer',
    'kirghiz',
    'korean',
    'laotian (include hmong)',
    'latvian',
    'lithuanian',
    'macedonian',
    'malagasy',
    'malay',
    'moldavian',
    'mongolian',
    'nepali',
    'norwegian',
    'oromo',
    'pashto',
    'polish',
    'portuguese',
    'romanian',
    'russian',
    'samoan',
    'serbo-croatian',
    'sinhalese',
    'slovakian',
    'slovenian',
    'somali',
    'sotho',
    'spanish',
    'swahili',
    'swazi',
    'swedish',
    'tagalog',
    'tajik',
    'thai',
    'tibetan',
    'tongan',
    'turkish',
    'turkmeni',
    'tswana',
    'unknown',
    'urdu',
    'uzbeki',
    'vietnamese',
    'xhosa',
    'zulu',
  ],
  'filters.attributes.education': [
    'high school',
    "bachelor's",
    "master's",
    'doctorate',
  ],
  'filters.attributes.smoker': ['smoker', 'non-smoker'],
};
