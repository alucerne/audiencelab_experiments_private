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

interface PreviewTableProps {
  data: Record<string, string>[];
}

export default function PreviewAudienceTable({ data }: PreviewTableProps) {
  const columns = useMemo(() => {
    if (data.length === 0) return [];

    const allKeys = new Set<string>();
    data.forEach((record) => {
      Object.keys(record).forEach((key) => allKeys.add(key));
    });

    return Array.from(allKeys).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ row }) => row.original[key] || '-',
    })) as ColumnDef<Record<string, string>>[];
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
              {headerGroup.headers.map((header) => {
                return (
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
                );
              })}
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
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="max-w-40 truncate whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
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
