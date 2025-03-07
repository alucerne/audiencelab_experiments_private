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

import { Badge } from '@kit/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import { DataTableColumnHeader } from '~/components/ui/data-table/data-table-column-header';
import { DataTablePagination } from '~/components/ui/data-table/data-table-pagination';
import { DataTableToolbar } from '~/components/ui/data-table/data-table-toolbar';
import { AudienceList } from '~/lib/audience/audience.service';

import AddAudienceDialog from '../add-audience-dialog';
import AudienceTableActions from './audience-table-actions';

const nameIdFilterFn: FilterFn<AudienceList> = (
  row,
  _,
  filterValue: string,
) => {
  const fullName = row.original.name.toLowerCase();
  const searchText = filterValue.toLowerCase();

  return fullName.includes(searchText);
};

export default function AudienceTable({
  audience,
}: React.PropsWithChildren<{
  audience: AudienceList[];
}>) {
  const staticColumns = useMemo<ColumnDef<AudienceList>[]>(
    () => [
      {
        accessorKey: 'name',
        accessorFn: (audience) => audience.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
      },
      {
        accessorKey: 'Status',
        accessorFn: (audience) => audience.latest_job.status,
        cell: ({ row: { original } }) => {
          return <AudienceStatusBadge status={original.latest_job.status} />;
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
        accessorFn: (audience) => audience.latest_job.created_at,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last Refreshed" />
        ),
        cell({ row: { original } }) {
          return getDateString(parseISO(original.latest_job.created_at));
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

  const table = useReactTable<AudienceList>({
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
    <div className="flex flex-col space-y-4">
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

export function AudienceStatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
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
    default:
      return (
        <Badge variant={'secondary'} className="capitalize">
          {status.toLowerCase().replace(/[-_]/g, ' ')}
        </Badge>
      );
  }
}

function getDateString(date: Date) {
  return format(date, 'MMM d yyyy, h:mm a');
}
