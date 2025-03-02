'use client';

import { useMemo, useState } from 'react';

import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { ChevronDown } from 'lucide-react';

import { Tables } from '@kit/supabase/database';
import { Badge } from '@kit/ui/badge';
import { buttonVariants } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { cn } from '@kit/ui/utils';

import { DataTableColumnHeader } from '~/components/ui/data-table/data-table-column-header';
import { DataTablePagination } from '~/components/ui/data-table/data-table-pagination';
import { DataTableToolbar } from '~/components/ui/data-table/data-table-toolbar';

import AddAudienceDialog from '../add-audience-dialog';
import AudienceTableActions from './audience-table-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nameIdFilterFn: FilterFn<any> = (row, columnId, filterValue: string) => {
  const fullName = String(row.getValue('name')).toLowerCase();
  const searchText = filterValue.toLowerCase();

  return fullName.includes(searchText);
};

export default function AudienceTable({
  audience,
}: React.PropsWithChildren<{
  audience: Tables<'audience'>[];
}>) {
  const staticColumns = useMemo<ColumnDef<Tables<'audience'>>[]>(
    () => [
      {
        accessorKey: 'name',
        accessorFn: (audience) => audience.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
      },
      {
        accessorKey: 'status',
        accessorFn: (audience) => audience.status,
        header: ({ column }) => {
          const statusFilter = column.getFilterValue() as
            | Tables<'audience'>['status']
            | undefined;

          function updateStatusFilter(
            value: Tables<'audience'>['status'] | 'reset' | undefined,
          ) {
            if (value === 'reset') {
              column.setFilterValue(undefined);
            } else {
              column.setFilterValue(value ?? undefined);
            }
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-8 text-sm data-[state=open]:bg-accent',
                  }),
                )}
              >
                {statusFilter ? (
                  <AudienceStatusBadge status={statusFilter} />
                ) : (
                  'Status'
                )}
                <ChevronDown className="ml-2 h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(newStatus) =>
                    updateStatusFilter(
                      newStatus as Tables<'audience'>['status'],
                    )
                  }
                >
                  {(
                    [
                      'no data',
                      'processing',
                      'completed',
                      'refreshing',
                      'refreshed',
                    ] as const
                  ).map((statusType, index) => (
                    <DropdownMenuRadioItem key={index} value={statusType}>
                      <AudienceStatusBadge status={statusType} />
                    </DropdownMenuRadioItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center"
                    onClick={() => updateStatusFilter('reset')}
                    disabled={!statusFilter}
                  >
                    Reset
                  </DropdownMenuItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        cell: ({ row: { original } }) => {
          return <AudienceStatusBadge status={original.status} />;
        },
      },
      {
        accessorKey: 'created_at',
        accessorFn: (audience) => audience.created_at,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Creation Date" />
        ),
        cell({ row: { original } }) {
          return getDateString(parseISO(original.created_at));
        },
      },
      {
        accessorKey: 'refreshed_at',
        accessorFn: (audience) => audience.refreshed_at,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last Refreshed" />
        ),
        cell({ row: { original } }) {
          return original.refreshed_at
            ? getDateString(parseISO(original.refreshed_at))
            : 'N/A';
        },
      },
      {
        id: 'actions',
        cell: ({ row: { original } }) => (
          <AudienceTableActions audience={original} />
        ),
      },
    ],
    [],
  );

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);

  const table = useReactTable<Tables<'audience'>>({
    data: audience || [],
    columns: staticColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: nameIdFilterFn,
  });

  return (
    <div className={'flex flex-col space-y-4'}>
      <DataTableToolbar
        table={table}
        dataName="Audience List"
        searchPlaceholder="Search by name..."
        actions={<AddAudienceDialog />}
      />
      <div className="w-full overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-card hover:bg-card">
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
                    <TableCell key={cell.id} className="whitespace-nowrap">
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
                  colSpan={staticColumns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

export function AudienceStatusBadge({
  status,
}: {
  status: Tables<'audience'>['status'];
}) {
  switch (status) {
    case 'no data':
      return <Badge variant={'destructive'}>No Data</Badge>;
    case 'processing':
      return <Badge variant={'info'}>Processing</Badge>;
    case 'completed':
      return <Badge variant={'success'}>Completed</Badge>;
    case 'refreshing':
      return <Badge variant={'info'}>Refreshing</Badge>;
    case 'refreshed':
      return <Badge variant={'success'}>Refreshed</Badge>;
  }
}

function getDateString(date: Date) {
  return format(date, 'MMM d yyyy, h:mm a');
}
