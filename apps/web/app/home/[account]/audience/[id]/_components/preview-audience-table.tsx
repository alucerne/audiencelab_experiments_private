'use client';

import React, { useMemo } from 'react';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { cn } from '@kit/ui/utils';

interface PreviewTableProps {
  data: Record<string, string>[];
}

/**
 * Optional dictionary for special-case column names
 * that should be displayed as friendlier text.
 */
const FRIENDLY_NAMES: Record<string, string> = {
  company: 'Company',
  company_domain: 'Company Domain',
  job_title: 'Job Title',
  first_name: 'First Name',
  last_name: 'Last Name',
  b2b_email: 'B2B Email',
  b2b_phone: 'B2B Phone',
  personal_phone: 'Personal Phone',
  personal_email: 'Personal Email',
  sha256: 'Hash',
};

/**
 * Fallback function to transform snake_case or
 * other keys into Title Case if they're not in FRIENDLY_NAMES.
 */
function toUserFriendlyName(key: string): string {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export default function PreviewAudienceTable({ data }: PreviewTableProps) {
  const columns = useMemo(() => {
    // Column for row numbering (#), 1-indexed
    const indexColumn: ColumnDef<Record<string, string>> = {
      id: 'rowIndex',
      header: '#',
      cell: ({ row }) => row.index + 1, // 1-based indexing
    };

    // If there's no data, only use the row index column
    if (data.length === 0) {
      return [indexColumn];
    }

    // Collect all unique keys from the data
    const allKeys = new Set<string>();
    data.forEach((record) => {
      Object.keys(record).forEach((key) => allKeys.add(key));
    });

    // Create a ColumnDef for each unique key
    const dataColumns = Array.from(allKeys).map((key) => ({
      accessorKey: key,
      header: FRIENDLY_NAMES[key] ?? toUserFriendlyName(key),
      cell: ({ row }) => row.original[key] || '-',
    })) as ColumnDef<Record<string, string>>[];

    return [indexColumn, ...dataColumns];
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-hidden border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="divide-muted-foreground/20 border-muted-foreground/20 divide-x border-b"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-secondary-foreground/80"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody className="bg-background">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="divide-muted-foreground/20 border-muted-foreground/20 divide-x"
              >
                {row.getVisibleCells().map((cell) => {
                  // For the row index column, apply a light-grey background
                  const isIndexColumn = cell.column.id === 'rowIndex';
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'max-w-40 truncate whitespace-nowrap',
                        isIndexColumn && 'bg-muted',
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
