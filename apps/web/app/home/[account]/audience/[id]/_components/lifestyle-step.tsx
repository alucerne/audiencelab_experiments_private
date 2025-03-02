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
import { AudienceFiltersFormValues } from '~/lib/audience/schema/audience-filters-form.schema';
import { AudienceFiltersFormValue } from '~/lib/audience/schema/audience-filters-form.schema';
import { formatNumberRange } from '~/lib/audience/utils';

import DynamicField from './dynamic-field';

export const lifestyleFields = [
  'filters.attributes.pets',
  'filters.attributes.cats',
  'filters.attributes.dogs',
  'filters.attributes.donateConservative',
  'filters.attributes.donateLiberal',
  'filters.attributes.donatePolitical',
  'filters.attributes.donateVeterans',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

type FieldRow = {
  fieldName: (typeof lifestyleFields)[number];
  fieldValue: string;
  rawValue: AudienceFiltersFormValue;
};

export default function LifestylsStep() {
  const form = useFormContext<AudienceFiltersFormValues>();
  const [tableData, setTableData] = useState<FieldRow[]>([]);

  const generateTableData = () => {
    const rows: FieldRow[] = [];

    lifestyleFields.forEach((field) => {
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
          <CardTitle>Lifestyle</CardTitle>
          <CardDescription>
            What lifestyle characteristics define your target audience?
          </CardDescription>
        </CardHeader>
        <AddFieldValueDialog
          onClose={() => setTableData(generateTableData())}
        />
      </div>
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
  value: (typeof lifestyleFields)[number];
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
  value: (typeof lifestyleFields)[number];
  label: string;
}> = [
  {
    value: 'filters.attributes.pets',
    label: 'Pets',
  },
  {
    value: 'filters.attributes.cats',
    label: 'Cats',
  },
  {
    value: 'filters.attributes.dogs',
    label: 'Dogs',
  },
  {
    value: 'filters.attributes.donateConservative',
    label: 'Conservative Donations',
  },
  {
    value: 'filters.attributes.donateLiberal',
    label: 'Liberal Donations',
  },
  {
    value: 'filters.attributes.donatePolitical',
    label: 'Political Donations',
  },
  {
    value: 'filters.attributes.donateVeterans',
    label: 'Veterans Donations',
  },
] as const;

const fieldOptions: Partial<
  Record<(typeof lifestyleFields)[number], string[]>
> = {};
