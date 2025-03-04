'use client';

import React, { useMemo, useTransition } from 'react';

import { useParams, useRouter } from 'next/navigation';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { toast } from 'sonner';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button } from '@kit/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import { addAudienceFiltersAction } from '~/lib/audience/server-actions';

interface PreviewTableProps {
  data: Record<string, string>[];
}

export default function PreviewAudienceTable({ data }: PreviewTableProps) {
  const router = useRouter();
  const { account, id } = useParams<{ account: string; id: string }>();
  const [pending, startTransition] = useTransition();

  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

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

  if (data.length === 0) {
    return <div className="py-6 text-center">No data available</div>;
  }

  function generateAudience() {
    startTransition(() => {
      toast.promise(
        addAudienceFiltersAction({
          accountId,
          audienceId: id,
        }),
        {
          loading: 'Generating audience...',
          success: () => {
            router.push(`/home/${account}`);

            return 'Audience generation in queue...';
          },
          error: 'Failed to generate audience',
        },
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Button onClick={generateAudience} disabled={pending}>
          Generate Audience
        </Button>
      </div>
      <div className="w-full overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-card hover:bg-card">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                    <TableCell
                      key={cell.id}
                      className="max-w-40 truncate whitespace-nowrap"
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
        </Table>
      </div>
    </div>
  );
}
