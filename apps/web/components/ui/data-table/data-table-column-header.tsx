import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn('text-sm whitespace-nowrap', className)}>{title}</div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Button
        aria-label={
          column.getIsSorted() === 'desc'
            ? `Sorted descending. Click to sort ascending.`
            : column.getIsSorted() === 'asc'
              ? `Sorted ascending. Click to sort descending.`
              : `Not sorted. Click to sort ascending.`
        }
        variant="ghost"
        size="sm"
        type="button"
        className="data-[state=open]:bg-accent -ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span className="text-sm whitespace-nowrap">{title}</span>
        {column.getIsSorted() === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
        ) : column.getIsSorted() === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" aria-hidden="true" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
