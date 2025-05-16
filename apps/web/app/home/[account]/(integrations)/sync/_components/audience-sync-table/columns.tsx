import { useIntegration } from '@integration-app/react';
import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

import { DataTableColumnHeader } from '@kit/ui/data-table-utils';

import StatusBadge from '~/components/ui/status-badge';
import { AudienceSyncList } from '~/lib/integration-app/audience-sync.service';

import SyncTableActions from './actions';

export const columns: ColumnDef<AudienceSyncList[number]>[] = [
  {
    accessorKey: 'audience_name',
    accessorFn: (sync) => sync.audience.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Audience" />
    ),
  },
  {
    accessorKey: 'integration_key',
    accessorFn: (sync) => sync.integration_key,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Connection" />
    ),
    cell: ({ row: { original } }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { integration } = useIntegration(original.integration_key);
      console.log('integration', integration);

      return (
        <div className="flex items-center gap-2">
          {integration?.logoUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={integration.logoUri}
              alt={`${integration.name} logo`}
              className="size-5 rounded-lg"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex size-5 items-center justify-center rounded-lg text-lg font-medium">
              {integration?.name[0]}
            </div>
          )}
          <div>{integration?.name}</div>
        </div>
      );
    },
  },
  {
    header: 'Status',
    accessorFn: (sync) => sync.sync_status,
    cell: ({ row: { original } }) => {
      return <StatusBadge status={original.sync_status} />;
    },
  },
  {
    accessorKey: 'created_at',
    accessorFn: (sync) => sync.created_at,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Creation Date" />
    ),
    cell({ row: { original } }) {
      return getDateString(parseISO(original.created_at));
    },
  },
  {
    accessorKey: 'next_scheduled_refresh',
    accessorFn: (sync) => sync.audience.next_scheduled_refresh,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Next Sync" />
    ),
    cell({ row: { original } }) {
      return original.audience.next_scheduled_refresh
        ? getDateString(parseISO(original.audience.next_scheduled_refresh))
        : null;
    },
  },
  {
    id: 'actions',
    cell: ({ row: { original } }) => <SyncTableActions sync={original} />,
  },
];

function getDateString(date: Date) {
  return format(date, 'MMM d yyyy, h:mm a');
}
