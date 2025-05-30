'use client';

import { useMemo, useRef } from 'react';

import { useParams } from 'next/navigation';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { FileX } from 'lucide-react';

import { Tables } from '@kit/supabase/database';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Button } from '@kit/ui/button';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { cn } from '@kit/ui/utils';

import { TeamAccountLayoutPageHeader } from '~/home/[account]/_components/team-account-layout-page-header';
import { ResolutionsPreview } from '~/lib/pixel/pixel.service';

type DataRow = {
  event_timestamp: string;
  event_type: string;
  hem_sha256: string;
  ip_address: string;
  activity_start_date: string;
  activity_end_date: string;
  referrer_url: string;
} & Record<string, string | number | string[]>;

export default function PixelPreview({
  pixel,
  preview,
}: {
  pixel: Tables<'pixel'>;
  preview: ResolutionsPreview;
}) {
  const { account } = useParams<{ account: string; id: string }>();

  const data = useMemo<DataRow[]>(
    () =>
      preview.events?.map((e) => ({
        event_timestamp: e.event_timestamp,
        event_type: e.event_type,
        hem_sha256: e.hem_sha256,
        activity_start_date: e.activity_start_date,
        activity_end_date: e.activity_end_date,
        referrer_url: e.referrer_url,
        ip_address: e.ip_address,
        ...(e.event_data ?? {}),
        ...(e.resolution ?? {}),
      })) ?? [],
    [preview.events],
  );

  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    if (data.length === 0) return [];

    const allKeys = new Set<keyof DataRow>();
    data.forEach((row) =>
      Object.keys(row).forEach((k) => allKeys.add(k as keyof DataRow)),
    );

    const columnOrderPriority: Record<keyof DataRow, number> = {
      timestamp: 1,
      sha: 2,
      ip_address: 3,
    };
    const specialCases: Partial<Record<keyof DataRow, string>> = {
      timestamp: 'Timestamp',
      sha: 'SHA256',
      ip_address: 'IP Address',
    };
    const formatColumnName = (k: string) =>
      specialCases[k as keyof DataRow] ??
      k
        .split('_')
        .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

    const rowNumCol: ColumnDef<DataRow> = {
      id: 'rowNumber',
      header: '',
      cell: ({ row }) => row.index + 1,
      size: 25,
    };

    const dataCols: ColumnDef<DataRow>[] = Array.from(allKeys)
      .sort(
        (a, b) =>
          (columnOrderPriority[a] || 100) - (columnOrderPriority[b] || 100),
      )
      .map((key) => ({
        accessorKey: key,
        header: formatColumnName(key),
        cell: ({ row }) => {
          const v = row.original[key];
          return Array.isArray(v) ? v.join(', ') : (v ?? '—');
        },
      }));

    return [rowNumCol, ...dataCols];
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
      <div className="flex-none">
        <div className="flex flex-col justify-between pb-6 min-[896px]:flex-row lg:pr-4 lg:pb-0">
          <TeamAccountLayoutPageHeader
            account={account}
            title={`Pixel Resolutions for ${new URL(pixel.website_url).hostname}`}
            description={<AppBreadcrumbs uuidLabel="Resolutions" />}
          />
        </div>
      </div>
      {preview.events && preview.events.length > 0 ? (
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
                            'max-w-48 truncate py-1.5 whitespace-nowrap',
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
                {preview.num_records.toLocaleString()}
              </span>{' '}
              {`resolution${preview.num_records === 1 ? '' : 's'} found`}
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
      ) : (
        <div className="bg-muted flex flex-1 flex-col items-center justify-center pb-20">
          <FileX className="mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">No Resolutions Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            This pixel has no resolutions. Check back later or verify that your
            pixel is installed.
          </p>
        </div>
      )}
    </>
  );
}
