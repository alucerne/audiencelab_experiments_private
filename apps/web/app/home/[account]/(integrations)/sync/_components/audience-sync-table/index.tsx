'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

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

import { Tables } from '@kit/supabase/database';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { buttonVariants } from '@kit/ui/button';
import {
  DataTablePagination,
  DataTableToolbar,
} from '@kit/ui/data-table-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { cn } from '@kit/ui/utils';

import pathsConfig from '~/config/paths.config';
import { AudienceSyncList } from '~/lib/integration-app/audience-sync.service';
import { getSyncByIdAction } from '~/lib/integration-app/server-actions';

import { columns } from './columns';

const nameIdFilterFn: FilterFn<AudienceSyncList[number]> = (
  row,
  _,
  filterValue: string,
) => {
  const audienceName = row.original.audience.name.toLowerCase();
  const integrationKey = row.original.integration_key.toLowerCase();
  const searchText = filterValue.toLowerCase();

  return (
    audienceName.includes(searchText) || integrationKey.includes(searchText)
  );
};

export default function AudienceSyncTable({
  syncs: initialSyncs,
}: React.PropsWithChildren<{
  syncs: AudienceSyncList;
}>) {
  const [syncs, setSyncs] = useState(initialSyncs);
  const {
    account: { id: accountId, slug },
  } = useTeamAccountWorkspace();
  const client = useSupabase();

  useEffect(() => {
    if (initialSyncs) {
      setSyncs(initialSyncs);
    }

    const subscription = client
      .channel(`sync-channel-${accountId}`)
      .on<Tables<'audience_sync'>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audience_sync',
          filter: `account_id=eq.${accountId}`,
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            try {
              const updatedSync = await getSyncByIdAction({
                id: payload.new.id,
              });

              setSyncs((current) =>
                current.map((item) =>
                  item.id === payload.new.id ? updatedSync : item,
                ),
              );
            } catch (error) {
              console.error('Error updating sync:', error);
            }
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [initialSyncs, client, accountId]);

  const table = useReactTable<AudienceSyncList[number]>({
    data: syncs,
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
        dataName="Connection"
        searchPlaceholder="Search by audience/connection..."
        actions={
          <Link
            href={pathsConfig.app.accountSyncNew.replace('[account]', slug)}
            className={cn(buttonVariants({ className: 'w-fit' }))}
          >
            New
          </Link>
        }
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
