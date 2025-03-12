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

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { buttonVariants } from '@kit/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { cn } from '@kit/ui/utils';

import { DataTablePagination } from '~/components/ui/data-table/data-table-pagination';
import { DataTableToolbar } from '~/components/ui/data-table/data-table-toolbar';
import pathsConfig from '~/config/paths.config';
import { Tables } from '~/lib/database.types';

import { columns } from './columns';

const nameIdFilterFn: FilterFn<Tables<'enrichment'>> = (
  row,
  _,
  filterValue: string,
) => {
  const fullName = row.original.name.toLowerCase();
  const searchText = filterValue.toLowerCase();

  return fullName.includes(searchText);
};

export default function EnrichmentTable({
  enrichment: initialEnrichment,
}: React.PropsWithChildren<{
  enrichment: Tables<'enrichment'>[];
}>) {
  const [enrichment, setEnrichment] = useState(initialEnrichment || []);
  const {
    account: { id: accountId, slug },
  } = useTeamAccountWorkspace();
  const client = useSupabase();

  useEffect(() => {
    if (initialEnrichment) {
      setEnrichment(initialEnrichment);
    }

    const subscription = client
      .channel(`enrichment-channel-${accountId}`)
      .on<Tables<'enrichment'>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrichment',
          filter: `account_id=eq.${accountId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            try {
              setEnrichment((current) =>
                current.map((item) =>
                  item.id === payload.new.id ? payload.new : item,
                ),
              );
            } catch (error) {
              console.error('Error updating enrichment:', error);
            }
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [initialEnrichment, client, accountId]);

  const table = useReactTable<Tables<'enrichment'>>({
    data: enrichment,
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
        dataName="Enrichment List"
        searchPlaceholder="Search by name..."
        actions={
          <Link
            href={pathsConfig.app.accountEnrichmentUpload.replace(
              '[account]',
              slug,
            )}
            className={cn(buttonVariants({ className: 'w-fit' }))}
          >
            Upload
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
