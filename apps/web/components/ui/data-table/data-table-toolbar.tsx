'use client';

import { Table } from '@tanstack/react-table';

import { Input } from '@kit/ui/input';
import { Separator } from '@kit/ui/separator';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  dataName: string;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  dataName,
  searchPlaceholder = 'Search...',
  actions,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between">
      <div className={'flex flex-1 items-center space-x-3'}>
        <Input
          placeholder={searchPlaceholder}
          value={table.getState().globalFilter ?? ''}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className={'w-full max-w-xs'}
        />
        <Separator orientation={'vertical'} className="py-2" />
        <div className="whitespace-nowrap text-sm font-medium">
          <span className="font-semibold">
            {table.getFilteredRowModel().rows.length.toLocaleString()}
          </span>{' '}
          {` ${dataName}${table.getFilteredRowModel().rows.length === 1 ? '' : 's'}`}
        </div>
      </div>
      {actions}
    </div>
  );
}
