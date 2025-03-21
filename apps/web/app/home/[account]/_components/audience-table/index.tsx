'use client';

import { useEffect, useState } from 'react';

import {
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import { DataTablePagination } from '~/components/ui/data-table/data-table-pagination';
import { DataTableToolbar } from '~/components/ui/data-table/data-table-toolbar';
import { AudienceList } from '~/lib/audience/audience.service';
import { getAudienceByIdAction } from '~/lib/audience/server-actions';
import { Database } from '~/lib/database.types';

import AddAudienceDialog from '../add-audience-dialog';
import { columns } from './columns';

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
  canCreate,
}: {
  audience: AudienceList[];
  canCreate: boolean;
}) {
  const [audience, setAudience] = useState(initialAudience || []);
  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();
  const client = useSupabase();

  useEffect(() => {
    if (initialAudience) {
      setAudience(initialAudience);
    }

    const subscription = client
      .channel(`enqueue-job-channel-${accountId}`)
      .on<Database['public']['Tables']['enqueue_job']['Row']>(
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

  const table = useReactTable<AudienceList>({
    data: audience,
    columns: columns,
    initialState: {
      sorting: [{ id: 'created_at', desc: true }],
      globalFilter: '',
      columnFilters: [],
    },
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
        actions={<AddAudienceDialog disabled={!canCreate} />}
      />
      <div className="w-full overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-card hover:bg-card">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
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
                  colSpan={columns.length}
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
