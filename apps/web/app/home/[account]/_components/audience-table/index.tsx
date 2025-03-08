'use client';

import { useEffect, useMemo, useState } from 'react';

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

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
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
import { getAudienceByIdAction } from '~/lib/audience/server-actions';
import { Tables } from '~/lib/database.types';

import AddAudienceDialog from '../add-audience-dialog';
import AudienceTableActions from './audience-table-actions';

/**
 * A custom filter function for searching by audience name (case-insensitive).
 */
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
  audience: initialAudience,
}: {
  audience: AudienceList[];
}) {
  const [audience, setAudience] = useState(initialAudience || []);
  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();
  const client = useSupabase();

  // Subscribe to "enqueue_job" changes so we can update the table in real time
  useEffect(() => {
    if (initialAudience) {
      setAudience(initialAudience);
    }

    // Set up a realtime subscription for the "enqueue_job" table
    const subscription = client
      .channel(`enqueue-job-channel-${accountId}`)
      .on<Tables<'enqueue_job'>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enqueue_job',
          filter: `account_id=eq.${accountId}`,
        },
        async (payload) => {
          if (
            payload.eventType === 'INSERT' ||
            payload.eventType === 'UPDATE'
          ) {
            try {
              // fetch updated audience info
              const updatedAudience = await getAudienceByIdAction({
                id: payload.new.audience_id,
              });
              if (updatedAudience && updatedAudience.latest_job) {
                setAudience((current) =>
                  current.map((item) => {
                    if (item.id === payload.new.audience_id) {
                      return {
                        ...updatedAudience,
                        latest_job:
                          updatedAudience.latest_job || item.latest_job,
                      };
                    }
                    return item;
                  }),
                );
              }
            } catch (error) {
              console.error('Error updating audience:', error);
            }
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [initialAudience, client, accountId]);

  // Define columns
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
        accessorKey: 'latest_job.total',
        accessorFn: (audience) => audience.latest_job?.total ?? 0,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Audience Size" />
        ),
        className: 'text-right',
        cell: ({ row }) => {
          const item = row.original;
          const total = item?.latest_job?.total;
          return total !== null && total !== undefined
            ? total.toLocaleString()
            : '';
        },
      },
      {
        accessorKey: 'refreshCount',
        accessorFn: (audience) => {
          // The refresh count is the number of jobs minus 1 (the first job is the creation)
          const length = audience.enqueue_job?.length ?? 0;
          return Math.max(length - 1, 0);
        },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Refresh Count" />
        ),
        className: 'text-right',
        cell: ({ row }) => {
          const refreshCount = row.getValue<number>('refreshCount');
          return refreshCount;
        },
      },
      {
        id: 'actions',
        cell: ({ row: { original } }) => (
          <AudienceTableActions
            audience={original}
            // We pass a callback that lets the child do a local update
            onLocalRefresh={(newJob) => {
              setAudience((prev) =>
                prev.map((item) => {
                  if (item.id === original.id) {
                    return {
                      ...item,
                      enqueue_job: [...(item.enqueue_job || []), newJob],
                    };
                  }
                  return item;
                }),
              );
            }}
          />
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

  // Build the table with react-table
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

/**
 * Display status with a badge
 */
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
