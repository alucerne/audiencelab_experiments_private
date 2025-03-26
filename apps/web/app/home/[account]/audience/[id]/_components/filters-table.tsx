import { useEffect, useState } from 'react';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Path, PathValue, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { CardTitle } from '@kit/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Label } from '@kit/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import SingleSelect from '~/components/ui/single-select';
import {
  AudienceFiltersFormValues,
  NumberRange,
} from '~/lib/audience/schema/audience-filters-form.schema';
import { formatNumberRange } from '~/lib/audience/utils';

import DynamicField from './dynamic-field';

type FieldRow<TField extends Path<AudienceFiltersFormValues>> = {
  fieldName: TField;
  fieldValue: string;
  rawValue: PathValue<AudienceFiltersFormValues, TField>;
};

type FieldOption<TField extends Path<AudienceFiltersFormValues>> = {
  value: TField;
  label: string;
};

interface FilterTableProps<
  TFields extends readonly Path<AudienceFiltersFormValues>[],
> {
  fields: TFields;
  fieldTypeOptions: FieldOption<TFields[number]>[];
  fieldOptions: Partial<Record<TFields[number], string[]>>;
}

export default function FilterTable<
  TFields extends readonly Path<AudienceFiltersFormValues>[],
>({ fields, fieldTypeOptions, fieldOptions }: FilterTableProps<TFields>) {
  const form = useFormContext<AudienceFiltersFormValues>();
  type AnyFieldRow = FieldRow<TFields[number]>;
  const [tableData, setTableData] = useState<AnyFieldRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const watchedValues = useWatch({
    control: form.control,
    name: fields,
  });

  function generateTableData() {
    const rows: AnyFieldRow[] = [];

    fields.forEach((field) => {
      const value = form.getValues(field);

      if (value === null || value === undefined) return;

      if (Array.isArray(value)) {
        if (value.length === 0) return;

        value.forEach((item) => {
          rows.push({
            fieldName: field,
            fieldValue: item,
            rawValue: value,
          } as AnyFieldRow);
        });
      } else if (
        typeof value === 'object' &&
        value !== null &&
        'min' in value &&
        'max' in value
      ) {
        if (value.min === null && value.max === null) return;

        rows.push({
          fieldName: field,
          fieldValue: formatNumberRange(value),
          rawValue: value,
        } as AnyFieldRow);
      }
    });

    return rows;
  }

  function handleDelete(row: AnyFieldRow) {
    const fieldName = row.fieldName;
    const currentValue = form.getValues(fieldName);

    if (Array.isArray(currentValue)) {
      const newValue = currentValue.filter((item) => item !== row.fieldValue);
      form.setValue(
        fieldName,
        newValue as PathValue<AudienceFiltersFormValues, typeof fieldName>,
      );
    } else if (
      typeof currentValue === 'object' &&
      currentValue !== null &&
      'min' in currentValue &&
      'max' in currentValue
    ) {
      form.setValue(fieldName, { min: null, max: null } as PathValue<
        AudienceFiltersFormValues,
        typeof fieldName
      >);
    }

    setTableData(generateTableData());
  }

  useEffect(() => {
    if (!dialogOpen) {
      setTableData(generateTableData());
    }
  }, [watchedValues, dialogOpen]);

  useEffect(() => {
    setTableData(generateTableData());
  }, []);

  const columns: ColumnDef<AnyFieldRow>[] = [
    {
      accessorKey: 'fieldName',
      header: 'Field',
      cell: ({ row: { original } }) => {
        const option = fieldTypeOptions.find((opt) =>
          opt.value.endsWith(original.fieldName as string),
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
            <Trash2 className="text-destructive h-4 w-4" />
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle>Filters</CardTitle>
        <AddFieldValueDialog
          fields={fields}
          fieldTypeOptions={fieldTypeOptions}
          fieldOptions={fieldOptions}
          onClose={() => setTableData(generateTableData())}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
        />
      </div>
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
  );
}

interface AddFieldValueDialogProps<
  TFields extends readonly Path<AudienceFiltersFormValues>[],
> {
  fields: TFields;
  fieldTypeOptions: FieldOption<TFields[number]>[];
  fieldOptions: Partial<Record<TFields[number], string[]>>;
  onClose: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

interface SelectedField<TField extends Path<AudienceFiltersFormValues>> {
  value: TField;
  label: string;
}

function AddFieldValueDialog<
  TFields extends readonly Path<AudienceFiltersFormValues>[],
>({
  fieldTypeOptions,
  fieldOptions,
  onClose,
  dialogOpen,
  setDialogOpen,
}: AddFieldValueDialogProps<TFields>) {
  type AnySelectedField = SelectedField<TFields[number]>;
  const [selectedField, setSelectedField] = useState<AnySelectedField | null>(
    null,
  );
  const [initialValue, setInitialValue] = useState<
    NumberRange | string[] | null
  >(null);
  const form = useFormContext<AudienceFiltersFormValues>();

  function handleOpenChange(open: boolean) {
    if (!open) {
      if (selectedField && initialValue !== null) {
        form.setValue(
          selectedField.value,
          initialValue as PathValue<
            AudienceFiltersFormValues,
            typeof selectedField.value
          >,
        );
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

    const isEmptyNumberRange =
      values &&
      typeof values === 'object' &&
      'min' in values &&
      'max' in values &&
      values.min === null &&
      values.max === null;

    if (!isEmptyNumberRange) {
      toast.success(
        `Added ${selectedField.label}: ${
          Array.isArray(values)
            ? values
                .map((value) => {
                  const valueStr = String(value);
                  return valueStr.charAt(0).toUpperCase() + valueStr.slice(1);
                })
                .join(', ')
            : formatNumberRange(values as NumberRange)
        }`,
      );
    }

    setDialogOpen(false);
    setSelectedField(null);
    setInitialValue(null);
    onClose();
  }

  function handleFieldChange(selected: string) {
    if (selectedField && initialValue !== null) {
      form.setValue(
        selectedField.value,
        initialValue as PathValue<
          AudienceFiltersFormValues,
          typeof selectedField.value
        >,
      );
    }

    const newField = fieldTypeOptions.find(
      (option) => option.label === selected,
    );

    if (newField) {
      const currentValue = form.getValues(newField.value);
      setInitialValue(currentValue as NumberRange | string[] | null);
      setSelectedField(newField as AnySelectedField);
    } else {
      setSelectedField(null);
      setInitialValue(null);
    }
  }

  useEffect(() => {
    if (!dialogOpen && selectedField && initialValue !== null) {
      form.setValue(
        selectedField.value,
        initialValue as PathValue<
          AudienceFiltersFormValues,
          typeof selectedField.value
        >,
      );
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
