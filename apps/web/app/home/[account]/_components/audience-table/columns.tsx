import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

import { DataTableColumnHeader } from '@kit/ui/data-table-utils';

import StatusBadge from '~/components/ui/status-badge';
import { AudienceList } from '~/lib/audience/audience.service';
import { Segment } from '~/lib/segments/segment.service';

import CombinedTableActions from './combined-actions';

// Combined type for audiences and segments
export type AudienceOrSegment = 
  | (AudienceList & { type: 'audience' })
  | (Segment & { type: 'segment' });

export const columns: ColumnDef<AudienceOrSegment>[] = [
  {
    accessorKey: 'name',
    accessorFn: (audience) => audience.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    header: 'Type',
    accessorFn: (item) => item.type,
    cell: ({ row: { original } }) => {
      if (original.type === 'audience') {
        return <StatusBadge status={original.latest_job.status} />;
      } else {
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Segment</span>;
      }
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
    accessorFn: (item) => item.type === 'audience' ? item.latest_job.created_at : item.updated_at,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Updated" />
    ),
    cell({ row: { original } }) {
      if (original.type === 'audience') {
        return getDateString(parseISO(original.latest_job.created_at));
      } else {
        return getDateString(parseISO(original.updated_at));
      }
    },
  },
  {
    accessorKey: 'audience_size',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size" />
    ),
    cell: ({ row: { original } }) => {
      if (original.type === 'audience') {
        return original.latest_job.current;
      } else {
        return 'Dynamic'; // Segments are dynamic and don't have a fixed size
      }
    },
  },
  {
    accessorKey: 'refresh_count',
    accessorFn: (item) => {
      if (item.type === 'audience') {
        const length = item.enqueue_jobs.length ?? 0;
        return Math.max(length - 1, 0);
      } else {
        return 0; // Segments don't have refresh counts
      }
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
    accessorFn: (item) => item.type === 'audience' ? item.next_scheduled_refresh : null,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Next Refresh" />
    ),
    cell({ row: { original } }) {
      if (original.type === 'audience') {
        return original.next_scheduled_refresh
          ? getDateString(parseISO(original.next_scheduled_refresh))
          : null;
      } else {
        return 'N/A'; // Segments don't have scheduled refreshes
      }
    },
  },
  {
    id: 'actions',
    cell: ({ row: { original } }) => (
      <CombinedTableActions item={original} />
    ),
  },
];

function getDateString(date: Date) {
  return format(date, 'MMM d yyyy, h:mm a');
}
