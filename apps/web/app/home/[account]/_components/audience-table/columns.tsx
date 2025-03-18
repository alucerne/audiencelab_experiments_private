import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

import { DataTableColumnHeader } from '~/components/ui/data-table/data-table-column-header';
import StatusBadge from '~/components/ui/status-badge';
import { AudienceList } from '~/lib/audience/audience.service';

import AudienceTableActions from './actions';

export const columns: ColumnDef<AudienceList>[] = [
  {
    accessorKey: 'name',
    accessorFn: (audience) => audience.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    header: 'Status',
    accessorFn: (audience) => audience.latest_job.status,
    cell: ({ row: { original } }) => {
      return <StatusBadge status={original.latest_job.status} />;
    },
  },
  {
    accessorKey: 'created_at',
    accessorFn: (audience) => audience.created_at,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Creation Date" />
    ),
    cell({ row: { original } }) {
      return getDateString(parseISO(original.created_at));
    },
  },
  {
    accessorKey: 'refreshed_at',
    accessorFn: (audience) => audience.latest_job.created_at,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Refreshed" />
    ),
    cell({ row: { original } }) {
      return getDateString(parseISO(original.latest_job.created_at));
    },
  },
  {
    accessorKey: 'audience_size',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Audience Size" />
    ),
    cell: ({ row: { original } }) => original.latest_job.current,
  },
  {
    accessorKey: 'refresh_count',
    accessorFn: (audience) => {
      const length = audience.enqueue_jobs.length ?? 0;
      return Math.max(length - 1, 0);
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Refresh Count" />
    ),
    cell: ({ row }) => {
      const refreshCount = row.getValue<number>('refresh_count');
      return refreshCount;
    },
  },
  {
    accessorKey: 'next_scheduled_refresh',
    accessorFn: (audience) =>
      audience.next_scheduled_refresh
        ? parseISO(audience.next_scheduled_refresh)
        : null,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Next Scheduled Refresh" />
    ),
    cell({ row }) {
      const nextScheduledRefresh = row.getValue<Date | null>(
        'next_scheduled_refresh',
      );

      return nextScheduledRefresh ? getDateString(nextScheduledRefresh) : '';
    },
  },
  {
    id: 'actions',
    cell: ({ row: { original } }) => (
      <AudienceTableActions audience={original} />
    ),
  },
];

function getDateString(date: Date) {
  return format(date, 'MMM d yyyy, h:mm a');
}
