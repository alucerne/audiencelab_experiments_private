'use client';

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

import { SignupLinkData } from '../../lib/server/services/admin-signup-links.service';
import CreateCodeDialog from './create-code-dialog';
import { getColumns } from './table-columns';

const nameIdFilterFn: FilterFn<SignupLinkData> = (
  row,
  _,
  filterValue: string,
) => {
  const code = row.original.code.toLowerCase();
  const searchText = filterValue.toLowerCase();

  return code.includes(searchText);
};

export default function SignupLinksTable({
  signupLinks,
  signupUrl,
  create = true,
}: {
  signupLinks: SignupLinkData[];
  signupUrl: string;
  create?: boolean;
}) {
  const columns = getColumns(signupUrl);

  const table = useReactTable<SignupLinkData>({
    data: signupLinks,
    columns,
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
        dataName="Signup Link"
        searchPlaceholder="Search by code..."
        actions={
          create ? <CreateCodeDialog signupUrl={signupUrl} /> : undefined
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
