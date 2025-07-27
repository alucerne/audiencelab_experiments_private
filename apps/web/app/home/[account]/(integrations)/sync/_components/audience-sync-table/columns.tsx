import { useIntegration } from '@integration-app/react';
import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

import { DataTableColumnHeader } from '@kit/ui/data-table-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';

import StatusBadge from '~/components/ui/status-badge';
import { Json } from '~/lib/database.types';
import { AudienceSyncList } from '~/lib/integration-app/audience-sync.service';
import { NewSyncFormSchema } from '~/lib/integration-app/schema/new-sync-form.schema';

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

      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent>
              <IntegrationDetails
                integrationDetails={original.integration_details}
              />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

function IntegrationDetails({
  integrationDetails,
}: {
  integrationDetails: Json;
}) {
  const parsedDetails =
    NewSyncFormSchema.shape.integration.safeParse(integrationDetails);

  if (!parsedDetails.success) {
    return <div>Failed to get integration details</div>;
  }

  switch (parsedDetails.data.integrationKey) {
    case 'facebook-ads':
      return (
        <>
          <div>
            <span className="font-semibold">Ad Account:</span>{' '}
            {parsedDetails.data.fbAdAccountName}
          </div>
          <div>
            <span className="font-semibold">Audience:</span>{' '}
            {parsedDetails.data.fbAudienceName}
          </div>
        </>
      );
    case 'google-sheets':
      return (
        <>
          <div>
            <span className="font-semibold">Spreadsheet:</span>{' '}
            {parsedDetails.data.googleSheetsSpreadsheetName}
          </div>
          <div>
            <span className="font-semibold">Sheet (Tab):</span>{' '}
            {parsedDetails.data.googleSheetsSheetName}
          </div>
        </>
      );
    default:
      return <div>Failed to get integration details</div>;
  }
}
