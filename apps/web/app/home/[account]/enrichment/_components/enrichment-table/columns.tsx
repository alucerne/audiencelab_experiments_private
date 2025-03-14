import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

import { Tables } from '@kit/supabase/database';

import { DataTableColumnHeader } from '~/components/ui/data-table/data-table-column-header';
import StatusBadge from '~/components/ui/status-badge';

import EnrichmentTableActions from './actions';

export const columns: ColumnDef<Tables<'job_enrich'>>[] = [
  {
    accessorKey: 'name',
    accessorFn: (enrichment) => enrichment.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    header: 'Status',
    accessorFn: (enrichment) => enrichment.status,
    cell: ({ row: { original } }) => {
      return <StatusBadge status={original.status} />;
    },
  },
  {
    accessorKey: 'created_at',
    accessorFn: (enrichment) => enrichment.created_at,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Creation Date" />
    ),
    cell({ row: { original } }) {
      return getDateString(parseISO(original.created_at));
    },
  },
  {
    id: 'actions',
    cell: ({ row: { original } }) => (
      <EnrichmentTableActions enrichment={original} />
    ),
  },
];

function getDateString(date: Date) {
  return format(date, 'MMM d yyyy, h:mm a');
}
