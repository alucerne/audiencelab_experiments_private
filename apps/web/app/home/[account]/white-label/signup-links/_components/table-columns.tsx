import { useState } from 'react';

import { ColumnDef } from '@tanstack/react-table';
import { format, isBefore, parseISO } from 'date-fns';
import { Check, Copy, Eye } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { DataTableColumnHeader } from '@kit/ui/data-table-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';

import { SignupLinkData } from '~/lib/white-label/white-label.service';

import { CodeUsersDialog } from './code-users-dialog';
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
      <DataTableColumnHeader column={column} title="Usage" />
    ),
    cell({ row: { original } }) {
      const usageCount = original.signup_code_usages.length;

      return (
        <div className="flex items-center gap-1">
          <p>{usageCount}</p>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <CodeUsersDialog signupLink={original}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={usageCount === 0}
                  >
                    <Eye size={14} />
                  </Button>
                </TooltipTrigger>
              </CodeUsersDialog>
              <TooltipContent>
                <p>View Users</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
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
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleCopy}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy Link</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
