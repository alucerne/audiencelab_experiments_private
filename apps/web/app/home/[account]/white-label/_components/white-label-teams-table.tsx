'use client';

import Link from 'next/link';

import {
  ColumnDef,
  FilterFn,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

import { Tables } from '@kit/supabase/database';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button } from '@kit/ui/button';
import {
  DataTablePagination,
  DataTableToolbar,
} from '@kit/ui/data-table-utils';

import pathsConfig from '~/config/paths.config';

const nameIdFilterFn: FilterFn<Tables<'accounts'>> = (
  row,
  _,
  filterValue: string,
) => {
  const fullName = row.original.name.toLowerCase();
  const searchText = filterValue.toLowerCase();

  return fullName.includes(searchText);
};

export default function WhiteLabelTeamsTable({
  accounts,
}: React.PropsWithChildren<{
  accounts: Tables<'accounts'>[];
}>) {
  const {
    account: { slug },
  } = useTeamAccountWorkspace();

  const columns: ColumnDef<Tables<'accounts'>>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => {
        return (
          <Link
            className={'hover:underline'}
            href={`${pathsConfig.app.accountWhiteLabelTeams.replace('[account]', slug)}/${row.original.id}`}
          >
            {row.original.name}
          </Link>
        );
      },
    },
    {
      id: 'created_at',
      header: 'Created At',
      accessorKey: 'created_at',
      cell: ({ row: { original } }) => {
        return original.created_at
          ? format(parseISO(original.created_at), 'MMM d yyyy, h:mm a')
          : null;
      },
    },
    {
      id: 'updated_at',
      header: 'Updated At',
      accessorKey: 'updated_at',
      cell: ({ row: { original } }) => {
        return original.updated_at
          ? format(parseISO(original.updated_at), 'MMM d yyyy, h:mm a')
          : null;
      },
    },
  ];

  const table = useReactTable<Tables<'accounts'>>({
    data: accounts,
    columns: columns,
    initialState: {
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
        dataName="Team"
        searchPlaceholder="Search by name..."
        actions={
          <Button asChild>
            <Link
              href={pathsConfig.app.accountWhiteLabelSignupLinks.replace(
                '[account]',
                slug,
              )}
            >
              Invite Teams
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className="bg-background rounded-lg border p-4 shadow-sm"
            >
              <h3 className="text-xl font-semibold">{row.original.name}</h3>
              <p className="text-muted-foreground text-sm">
                Created on{' '}
                {row.original.created_at
                  ? format(parseISO(row.original.created_at), 'MMM d yyyy')
                  : 'N/A'}
              </p>
              <div className="mt-4">
                <Button asChild className="w-full">
                  <Link
                    href={`${pathsConfig.app.accountWhiteLabelTeams.replace('[account]', slug)}/${row.original.id}`}
                  >
                    Manage
                  </Link>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center sm:col-span-3 lg:col-span-4">
            No teams found.
          </div>
        )}
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
