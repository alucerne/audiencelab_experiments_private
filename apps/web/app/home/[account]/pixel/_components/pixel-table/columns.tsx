import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

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
    accessorKey: 'last_sync',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Sync" />
    ),
    cell({ row: { original } }) {
      return original.last_sync
        ? getDateString(parseISO(original.last_sync))
        : null;
    },
  },
  {
    id: 'actions',
    cell: ({ row: { original } }) => <PixelTableActions pixel={original} />,
  },
];

function getDateString(date: Date) {
  return format(date, 'MMM d yyyy, h:mm a');
}
