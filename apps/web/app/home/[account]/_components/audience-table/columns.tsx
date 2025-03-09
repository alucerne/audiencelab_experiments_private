import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

import { Badge } from '@kit/ui/badge';

import { DataTableColumnHeader } from '~/components/ui/data-table/data-table-column-header';
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
      return <AudienceStatusBadge status={original.latest_job.status} />;
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
    header: 'Audience Size',
    cell: ({ row: { original } }) => {
      return (
        <ProgressBar
          current={original.latest_job.current}
          total={original.latest_job.total}
          csv_url={original.latest_job.csv_url}
        />
      );
    },
  },
  {
    accessorKey: 'refreshCount',
    accessorFn: (audience) => {
      const length = audience.enqueue_jobs.length ?? 0;
      return Math.max(length - 1, 0);
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Refresh Count" />
    ),
    cell: ({ row }) => {
      const refreshCount = row.getValue<number>('refreshCount');
      return refreshCount;
    },
  },
  {
    id: 'actions',
    cell: ({ row: { original } }) => (
      <AudienceTableActions audience={original} />
    ),
  },
];

function AudienceStatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'no data':
      return <Badge variant={'destructive'}>No Data</Badge>;
    case 'processing':
      return <Badge variant={'info'}>Processing</Badge>;
    case 'completed':
      return <Badge variant={'success'}>Completed</Badge>;
    case 'refreshing':
      return <Badge variant={'info'}>Refreshing</Badge>;
    case 'refreshed':
      return <Badge variant={'success'}>Refreshed</Badge>;
    default:
      return (
        <Badge variant={'secondary'} className="capitalize">
          {status.toLowerCase().replace(/[-_]/g, ' ')}
        </Badge>
      );
  }
}

function getDateString(date: Date) {
  return format(date, 'MMM d yyyy, h:mm a');
}

function ProgressBar({
  current,
  total,
  csv_url,
}: {
  current: number | null;
  total: number | null;
  csv_url: string | null;
}) {
  if (current === null || total === null || total === 0) {
    return (
      <div className="w-[60%]">
        <div className="bg-muted h-2 w-full min-w-12 rounded-full"></div>
      </div>
    );
  }

  const percentage = Math.min(Math.round((current / total) * 100), 100);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  const formattedCurrent = formatNumber(current);
  const formattedTotal = formatNumber(total);

  return (
    <div className="w-full pr-4">
      <div className="flex items-center gap-2">
        <div className="bg-muted h-2 w-full min-w-12 rounded-full">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {csv_url
            ? `${formattedCurrent}/${formattedCurrent}`
            : `${formattedCurrent}/${formattedTotal}`}
        </span>
      </div>
    </div>
  );
}
