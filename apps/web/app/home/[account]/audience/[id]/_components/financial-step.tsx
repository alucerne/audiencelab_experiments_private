import { useEffect, useState } from 'react';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Path, useFormContext } from 'react-hook-form';
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
import {
  AudienceFiltersFormValue,
  AudienceFiltersFormValues,
  NumberRange,
} from '~/lib/audience/schema/audience-filters-form.schema';
import { formatNumberRange } from '~/lib/audience/utils';

import DynamicField from './dynamic-field';

export const financialFields = [
  'filters.profile.incomeRange',
  'filters.profile.netWorth',
  'filters.attributes.creditRating',
  'filters.attributes.creditRangeNewCredit',
  'filters.attributes.creditCardUser',
  'filters.attributes.investment',
  'filters.attributes.mortgageAmount',
  'filters.attributes.mortgageLoanType',
  'filters.attributes.mortgageRateType',
  'filters.attributes.occupationGroup',
  'filters.attributes.occupationType',
  'filters.attributes.craCode',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

type FieldRow = {
  fieldName: (typeof financialFields)[number];
  fieldValue: string;
  rawValue: AudienceFiltersFormValue;
};

export default function FinancialStep() {
  const form = useFormContext<AudienceFiltersFormValues>();
  const [tableData, setTableData] = useState<FieldRow[]>([]);

  const generateTableData = () => {
    const rows: FieldRow[] = [];

    financialFields.forEach((field) => {
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
      } else if (
        typeof value === 'object' &&
        'min' in value &&
        'max' in value
      ) {
        if (value.min === 0 && value.max === 0) return;

        rows.push({
          fieldName: field,
          fieldValue: formatNumberRange(value),
          rawValue: value,
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
    } else if (typeof currentValue === 'object' && 'min' in currentValue) {
      form.setValue(row.fieldName, { min: 0, max: 0 });
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
          <CardTitle>Financial</CardTitle>
          <CardDescription>
            What is your target audience&apos;s financial profile?
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
  value: (typeof financialFields)[number];
  label: string;
}

function AddFieldValueDialog({ onClose }: { onClose: () => void }) {
  const [selectedField, setSelectedField] = useState<SelectedField | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialValue, setInitialValue] = useState<
    NumberRange | string[] | null
  >(null);
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
  value: (typeof financialFields)[number];
  label: string;
}> = [
  {
    value: 'filters.profile.incomeRange',
    label: 'Income Range',
  },
  {
    value: 'filters.profile.netWorth',
    label: 'Net Worth',
  },
  {
    value: 'filters.attributes.creditRating',
    label: 'Credit Rating',
  },
  {
    value: 'filters.attributes.creditRangeNewCredit',
    label: 'New Credit Range',
  },
  {
    value: 'filters.attributes.creditCardUser',
    label: 'Credit Card User',
  },
  {
    value: 'filters.attributes.investment',
    label: 'Investment',
  },
  {
    value: 'filters.attributes.mortgageAmount',
    label: 'Mortgage Amount',
  },
  {
    value: 'filters.attributes.mortgageLoanType',
    label: 'Mortgage Loan Type',
  },
  {
    value: 'filters.attributes.mortgageRateType',
    label: 'Mortgage Rate Type',
  },
  {
    value: 'filters.attributes.occupationGroup',
    label: 'Occupation Group',
  },
  {
    value: 'filters.attributes.occupationType',
    label: 'Occupation Type',
  },
  {
    value: 'filters.attributes.craCode',
    label: 'CRA Code',
  },
] as const;

const fieldOptions: Partial<
  Record<(typeof financialFields)[number], string[]>
> = {
  'filters.profile.incomeRange': [
    'less than $20,000',
    '$20,000 - $44,999',
    '$45,000 - $59,999',
    '$60,000 - $74,999',
    '$75,000 - $89,999',
    '$90,000 - $119,999',
    '$120,000 - $149,999',
    '$150,000 - $199,999',
    '$200,000 - $249,999',
    '$250,000 +',
  ],
  'filters.profile.netWorth': [
    '-$20,000 to -$2,500',
    '-$2,499 to $2,499',
    '$2,500 to $24,999',
    '$25,000 to $49,999',
    '$50,000 to $74,999',
    '$75,000 to $99,999',
    '$100,000 to $149,999',
    '$150,000 to $249,999',
    '$250,000 to $374,999',
    '$375,000 to $499,999',
    '$500,000 to $749,999',
    '$750,000 to $999,999',
    'more than $1,000,000',
  ],
  'filters.attributes.creditRating': [
    '800+',
    '750 - 799',
    '700 - 749',
    '650 - 699',
    '600 - 649',
    '550 - 599',
    '500-549',
    'under 499',
  ],
  'filters.attributes.creditRangeNewCredit': ['low', 'moderate', 'high'],
  'filters.attributes.creditCardUser': ['yes', 'no'],
  'filters.attributes.investment': ['investor', 'non-investor'],
  //!mortage fields
  'filters.attributes.occupationGroup': [
    'professional / technical',
    'administration / managerial',
    'sales / service',
    'clerical / white collar',
    'craftsman / blue collar',
    'student',
    'homemaker',
    'retired',
    'farmer',
    'military',
    'religious',
    'self employed',
    'self employed - professional / technical',
    'self employed - administration / managerial',
    'self employed - sales / service',
    'self employed - clerical / white collar',
    'self employed - craftsman / blue collar',
    'self employed - student',
    'self employed - homemaker',
    'self employed - retired',
    'self employed - other',
    'educator',
    'financial professional',
    'legal professional',
    'medical professional',
    'other',
  ],
  'filters.attributes.occupationType': [
    'professional',
    'architect',
    'chemist',
    'curator',
    'engineer',
    'engineer/aerospace',
    'engineer/chemical',
    'engineer/civil',
    'engineer/electrical/electronic',
    'engineer/field',
    'engineer/industrial',
    'engineer/mechanical',
    'geologist',
    'home economist',
    'legal/attorney/lawyer',
    'librarian/archivist',
    'medical doctor/physician',
    'pastor',
    'pilot',
    'scientist',
    'statistician/actuary',
    'veterinarian',
    'computer',
    'computer operator',
    'computer programmer',
    'computer/systems analyst',
    'executive/upper management',
    'ceo/cfo/chairman/corp officer',
    'comptroller',
    'politician/legislator/diplomat',
    'president',
    'treasurer',
    'vice president',
    'middle management',
    'account executive',
    'director/art director',
    'director/executive director',
    'editor',
    'manager',
    'manager/assistant manager',
    'manager/branch manager',
    'manager/credit manager',
    'manager/district manager',
    'manager/division manager',
    'manger/general manager',
    'manager/marketing manager',
    'manager/office manager',
    'manager/plant manager',
    'manager/product manager',
    'manager/project manager',
    'manager/property manager',
    'manager/regional manager',
    'manager/sales manager',
    'manager/store manager',
    'manager/traffic manager',
    'manager/warehouse manager',
    'planner',
    'principal/dean/educator',
    'superintendent',
    'supervisor',
    'white collar worker',
    'accounting/biller/billing clerk',
    'actor/entertainer/announcer',
    'adjuster',
    'administration/management',
    'advertising',
    'agent',
    'aide/assistant',
    'aide/assistant/executive',
    'aide/assistant/office',
    'aide/assistant/school',
    'aide/assistant/staff',
    'aide/assistant/technical',
    'analyst',
    'appraiser',
    'artist',
    'auctioneer',
    'auditor',
    'banker',
    'banker/loan office',
    'banker/loan processor',
    'bookkeeper',
    'broker',
    'broker/stock/trader',
    'buyer',
    'cashier',
    'caterer',
    'checker',
    'claims examiner/rep/adjudicator',
    'clerk',
    'clerk/file',
    'collector',
    'communications',
    'conservation/environment',
    'consultant/advisor',
    'coordinator',
    'customer service/representative',
    'designer',
    'detective/investigator',
    'dispatcher',
    'draftsman',
    'estimator',
    'expeditor',
    'finance',
    'flight attendant/steward',
    'florist',
    'graphic designer/commercial artist',
    'hostess/host/usher',
    'insurance/agent',
    'insurance/underwriter',
    'interior designer',
    'jeweler',
    'marketing',
    'merchandiser',
    'model',
    'musician/music/dance',
    'personnel/recruiter/interviewer',
    'photography',
    'public relations',
    'publishing',
    'purchasing',
    'quality control',
    'real estate/realtor',
    'receptionist',
    'reporter',
    'researcher',
    'sales',
    'sales clerk/counterman',
    'security',
    'surveyor',
    'technician',
    'telemarketer/telephone/operator',
    'teller/bank teller',
    'tester',
    'transcripter/translator',
    'travel agent',
    'union member/rep.',
    'ward clerk',
    'water treatment',
    'writer',
    'blue collar worker',
    'animal technician/groomer',
    'apprentice',
    'assembler',
    'athlete/professional',
    'attendant',
    'auto mechanic',
    'baker',
    'barber/hairstylist/beautician',
    'bartender',
    'binder',
    'bodyman',
    'brakeman',
    'brewer',
    'butcher/meat cutter',
    'carpenter/furniture/woodworking',
    'chef/butler',
    'child care/day care/babysitter',
    'cleaner/laundry',
    'clerk/deli',
    'clerk/produce',
    'clerk/stock',
    'conductor',
    'construction',
    'cook',
    'cosmetologist',
    'courier/delivery/messenger',
    'crewman',
    'custodian',
    'cutter',
    'dock worker',
    'driver',
    'driver/bus driver',
    'driver/truck driver',
    'electrician',
    'fabricator',
    'factory workman',
    'farmer/dairyman',
    'finisher',
    'fisherman/seaman',
    'fitter',
    'food service',
    'foreman/crew leader',
    'foreman/shop foreman',
    'forestry',
    'foundry worker',
    'furrier',
    'gardener/landscaper',
    'glazier',
    'grinder',
    'grocer',
    'helper',
    'housekeeper/maid',
    'inspector',
    'installer',
    'ironworker',
    'janitor',
    'journeyman',
    'laborer',
    'lineman',
    'lithographer',
    'loader',
    'locksmith',
    'machinist',
    'maintenance',
    'maintenance/supervisor',
    'mason/brick/etc.',
    'material handler',
    'mechanic',
    'meter reader',
    'mill worker',
    'millwright',
    'miner',
    'mold maker/molder/injection mold',
    'oil industry/driller',
    'operator',
    'operator/boilermaker',
    'operator/crane operator',
    'operator/forklift operator',
    'operator/machine operator',
    'packer',
    'painter',
    'parts (auto etc.)',
    'pipe fitter',
    'plumber',
    'polisher',
    'porter',
    'press operator',
    'presser',
    'printer',
    'production',
    'repairman',
    'roofer',
    'sanitation/exterminator',
    'seamstress/tailor/handicraft',
    'setup man',
    'sheet metal worker/steel worker',
    'shipping/import/export/custom',
    'sorter',
    'toolmaker',
    'transportation',
    'typesetter',
    'upholstery',
    'utility',
    'waiter/waitress',
    'welder',
    'health services',
    'chiropractor',
    'dental assistant',
    'dental hygienist',
    'dentist',
    'dietician',
    'health care',
    'medical assistant',
    'medical secretary',
    'medical technician',
    'medical/paramedic',
    'nurses aide/orderly',
    'optician',
    'optometrist',
    'pharmacist/pharmacy',
    'psychologist',
    'technician/lab',
    'technician/x-ray',
    'therapist',
    'therapists/physical',
    'nurse',
    'nurse (registered)',
    'nurse/lpn',
    'social worker/case worker',
    'legal/paralegal/assistant',
    'legal secretary',
    'secretary',
    'typist',
    'data entry/key punch',
    'homemaker',
    'retired',
    'retired/pensioner',
    'part time',
    'student',
    'volunteer',
    'armed forces',
    'army credit union trades',
    'navy credit union trades',
    'air force',
    'national guard',
    'coast guard',
    'marines',
    'coach',
    'counselor',
    'instructor',
    'lecturer',
    'professor',
    'teacher',
    'trainer',
    'civil service',
    'air traffic control',
    'civil service/government',
    'corrections/probation/parole',
    'court reporter',
    'firefighter',
    'judge/referee',
    'mail carrier/postal',
    'mail/postmaster',
    'police/trooper',
  ],
  'filters.attributes.craCode': [
    'low income',
    'moderate income',
    'middle income',
    'high income',
  ],
};
