'use client';

import Link from 'next/link';

import {
  ColumnDef,
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
import { format, parseISO } from 'date-fns';
import { EllipsisVertical } from 'lucide-react';

import { Tables } from '@kit/supabase/database';
import { Button } from '@kit/ui/button';
import {
  DataTablePagination,
  DataTableToolbar,
} from '@kit/ui/data-table-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { If } from '@kit/ui/if';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import { AdminDeleteAccountDialog } from '../admin-delete-account-dialog';
import { AdminDeleteUserDialog } from '../admin-delete-user-dialog';
import { AdminImpersonateUserDialog } from '../admin-impersonate-user-dialog';

const nameIdFilterFn: FilterFn<Tables<'accounts'>> = (
  row,
  _,
  filterValue: string,
) => {
  const fullName = row.original.name.toLowerCase();
  const searchText = filterValue.toLowerCase();

  return fullName.includes(searchText);
};

export default function AdminWhiteLabelTeamsTable({
  accounts,
}: React.PropsWithChildren<{
  accounts: Tables<'accounts'>[];
}>) {
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

export const columns: ColumnDef<Tables<'accounts'>>[] = [
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) => {
      return (
        <Link
          className={'hover:underline'}
          href={`/admin/teams/${row.original.id}`}
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
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const isPersonalAccount = row.original.is_personal_account;
      const userId = row.original.id;

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={'ghost'} size={'icon'} className="size-7">
                <EllipsisVertical className={'h-4'} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align={'end'}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link
                    className={'h-full w-full'}
                    href={`/admin/teams/${userId}`}
                  >
                    View
                  </Link>
                </DropdownMenuItem>
                <If condition={isPersonalAccount}>
                  <AdminImpersonateUserDialog userId={userId}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Impersonate User
                    </DropdownMenuItem>
                  </AdminImpersonateUserDialog>

                  <AdminDeleteUserDialog userId={userId}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Delete Personal Account
                    </DropdownMenuItem>
                  </AdminDeleteUserDialog>
                </If>
                <If condition={!isPersonalAccount}>
                  <AdminDeleteAccountDialog accountId={row.original.id}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Delete Team Account
                    </DropdownMenuItem>
                  </AdminDeleteAccountDialog>
                </If>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
