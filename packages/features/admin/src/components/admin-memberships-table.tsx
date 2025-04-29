'use client';

import Link from 'next/link';

import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { EllipsisVertical } from 'lucide-react';

import { Tables } from '@kit/supabase/database';
import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { DataTable } from '@kit/ui/enhanced-data-table';

type Membership = Tables<'accounts_memberships'> & {
  account: {
    id: string;
    name: string;
  };
};

export function AdminMembershipsTable(props: { memberships: Membership[] }) {
  return <DataTable data={props.memberships} columns={getColumns()} />;
}

function getColumns(): ColumnDef<Membership>[] {
  return [
    {
      header: 'User ID',
      accessorKey: 'user_id',
      cell: ({ row }) => {
        return <span className="line-clamp-1">{row.original.user_id}</span>;
      },
    },
    {
      header: 'Team',
      cell: ({ row }) => {
        return (
          <Link
            className={'hover:underline'}
            href={`/admin/users/${row.original.account_id}`}
          >
            {row.original.account.name}
          </Link>
        );
      },
    },
    {
      header: 'Role',
      accessorKey: 'account_role',
    },
    {
      header: 'Created At',
      accessorKey: 'created_at',
      cell: ({ row: { original } }) => {
        return format(parseISO(original.created_at), 'MMM d yyyy, h:mm a');
      },
    },
    {
      header: 'Updated At',
      accessorKey: 'updated_at',
      cell: ({ row: { original } }) => {
        return format(parseISO(original.created_at), 'MMM d yyyy, h:mm a');
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={'ghost'} size={'icon'} className="size-7">
                  <EllipsisVertical className={'h-4'} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align={'end'}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <Link
                      className={'h-full w-full'}
                      href={`/admin/users/${row.original.account_id}`}
                    >
                      View
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
