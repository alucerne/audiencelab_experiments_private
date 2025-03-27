'use client';

import React, { useMemo, useRef } from 'react';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@kit/ui/button';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { cn } from '@kit/ui/utils';

export default function PreviewAudienceTable({
  data,
  previewDataCount,
}: {
  data: Record<string, string>[];
  previewDataCount: number;
}) {
  function formatColumnName(key: string) {
    const specialCases: Record<string, string> = {
      first_name: 'First Name',
      last_name: 'Last Name',
      personal_email: 'Personal Email',
      sha256: 'Hash',
      b2b_phone: 'Business Phone',
      personal_phone: 'Personal Phone',
      company: 'Company',
      company_domain: 'Company Domain',
      job_title: 'Job Title',
      b2b_email: 'Business Email',
    };

    if (key in specialCases) {
      return specialCases[key] || key;
    }

    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const columnOrderPriority: Record<string, number> = {
    first_name: 1,
    last_name: 2,
    b2b_email: 3,
    b2b_phone: 4,
    company: 5,
    company_domain: 6,
    job_title: 7,
    personal_phone: 8,
    personal_email: 9,
    sha256: 10,
  };

  const columns = useMemo(() => {
    if (data.length === 0) return [];

    const allKeys = new Set<string>();
    data.forEach((record) => {
      Object.keys(record).forEach((key) => allKeys.add(key));
    });

    const dataColumns = Array.from(allKeys)
      .sort((a, b) => {
        const priorityA = columnOrderPriority[a] || 100;
        const priorityB = columnOrderPriority[b] || 100;
        return priorityA - priorityB;
      })
      .map((key) => ({
        accessorKey: key,
        header: formatColumnName(key),
        cell: ({ row }) => row.original[key] || '-',
      })) as ColumnDef<Record<string, string>>[];

    const rowNumberColumn: ColumnDef<Record<string, string>> = {
      id: 'rowNumber',
      header: '',
      cell: ({ row }) => row.index + 1,
      size: 25,
    };

    return [rowNumberColumn, ...dataColumns];
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 100,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const resetScroll = () =>
    scrollContainerRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-4 overflow-y-auto"
      >
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="bg-muted sticky top-0 z-[1] shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-secondary-foreground/80 h-fit py-1.5 whitespace-nowrap',
                      header.id !== 'rowNumber' ? 'min-w-28' : 'min-w-12',
                      index > 1 && 'border-l-muted-foreground/20 border-l',
                    )}
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
            {table.getPaginationRowModel().rows?.length ? (
              table.getPaginationRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-muted-foreground/20"
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'max-w-40 truncate py-1.5 whitespace-nowrap',
                        cell.column.id !== 'rowNumber' && 'min-w-28',
                        index > 1 && 'border-muted-foreground/20 border-l',
                      )}
                    >
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
        </table>
      </div>
      <div className="bg-muted border-muted-foreground/20 flex items-center justify-between border-t px-4 py-2.5">
        <div className="text-sm font-medium whitespace-nowrap">
          <span className="font-semibold">
            {previewDataCount.toLocaleString()}
          </span>{' '}
          {`result${previewDataCount === 1 ? '' : 's'} found`}
        </div>
        <div className="flex items-center gap-3">
          {table.getPageCount() > 0 && (
            <div className="text-xs font-medium">
              {table.getState().pagination.pageIndex + 1}
              {' / '}
              {table.getPageCount()}
            </div>
          )}
          {table.getRowModel().rows?.length ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  table.previousPage();
                  resetScroll();
                }}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  table.nextPage();
                  resetScroll();
                }}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
