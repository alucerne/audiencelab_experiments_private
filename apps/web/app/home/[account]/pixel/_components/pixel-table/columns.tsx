import { ColumnDef } from '@tanstack/react-table';

import { Tables } from '@kit/supabase/database';
import { DataTableColumnHeader } from '@kit/ui/data-table-utils';

import PixelTableActions from './actions';

export const columns: ColumnDef<Tables<'pixel'>>[] = [
  {
    accessorKey: 'websiteName',
    accessorFn: (row) => row.website_name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Website Name" />
    ),
  },
  {
    accessorKey: 'website_url',
    header: 'Website Url',
  },
  {
    accessorKey: 'webhook_url',
    header: 'Data Webhook Url',
  },
  {
    accessorKey: 'trial_days',
    header: 'Trial Days',
  },
  {
    accessorKey: 'trial_resolutions',
    header: 'Trial Resolutions',
  },
  {
    id: 'actions',
    cell: ({ row: { original } }) => <PixelTableActions pixel={original} />,
  },
];
