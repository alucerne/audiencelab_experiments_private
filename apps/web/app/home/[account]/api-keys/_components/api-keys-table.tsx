'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { Badge } from '@kit/ui/badge';
import { DataTable } from '@kit/ui/data-table';

import { Database } from '~/lib/database.types';

import DisableApiKeyDialog from './disable-api-key-dialog';

type ApiKeys = Database['public']['Functions']['list_api_keys']['Returns'];

export default function ApiKeysTable({ apiKeys }: { apiKeys: ApiKeys }) {
  return <DataTable data={apiKeys} columns={columns} />;
}

export const columns: ColumnDef<ApiKeys[number]>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'key_prefix',
    header: 'Key Prefix',
    cell({ row }) {
      return `${row.original.key_prefix}...`;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell({ row }) {
      return format(new Date(row.original.created_at), 'MM/dd/yy');
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell({ row }) {
      return row.original.is_active ? (
        <Badge variant="success">Active</Badge>
      ) : (
        <Badge variant="destructive">Disabled</Badge>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => {
      return row.original.is_active ? (
        <div className="flex items-center justify-end pr-2">
          <DisableApiKeyDialog apiKey={row.original} />
        </div>
      ) : null;
    },
  },
];
