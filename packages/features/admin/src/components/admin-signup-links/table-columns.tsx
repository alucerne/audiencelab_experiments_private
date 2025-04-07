import { useState } from 'react';

import { ColumnDef } from '@tanstack/react-table';
import { format, isBefore, parseISO } from 'date-fns';
import { Check, Copy } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { DataTableColumnHeader } from '@kit/ui/data-table-utils';

import { SignupLinkData } from '../../lib/server/services/admin-signup-links.service';
import SignupLinksTableActions from './table-actions';

export const getColumns = (signupUrl: string): ColumnDef<SignupLinkData>[] => [
  {
    accessorKey: 'name',
    accessorFn: (row) => row.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: 'code',
    accessorFn: (row) => row.code,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell({ row: { original } }) {
      const code = original.code;
      const url = `${signupUrl}?code=${code}`;

      return (
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {url}
          </a>
          <CopyButton value={url} />
        </div>
      );
    },
  },
  {
    accessorKey: 'enabled',
    accessorFn: (row) => row.enabled,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Enabled" />
    ),
    cell({ row: { original } }) {
      const usageCount = original.signup_code_usages.length;
      const isExpired = original.expires_at
        ? isBefore(new Date(original.expires_at), new Date())
        : false;
      const isOverLimit =
        original.max_usage !== null && usageCount >= original.max_usage;

      const isEffectivelyEnabled =
        original.enabled && !isExpired && !isOverLimit;

      return isEffectivelyEnabled ? (
        <Badge variant="success">Enabled</Badge>
      ) : (
        <Badge variant="destructive">Disabled</Badge>
      );
    },
  },
  {
    accessorKey: 'usages',
    accessorFn: (row) => row.signup_code_usages.length,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usages" />
    ),
  },
  {
    accessorKey: 'created_at',
    accessorFn: (row) => row.created_at,
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
      <SignupLinksTableActions signupLink={original} />
    ),
  },
];

function getDateString(date: Date) {
  return format(date, 'MMM d yyyy, h:mm a');
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button onClick={handleCopy} variant="ghost" size="icon">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}
