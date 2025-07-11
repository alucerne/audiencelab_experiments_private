'use client';

import Link from 'next/link';

import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { EllipsisVertical } from 'lucide-react';

import { Database } from '@kit/supabase/database';
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
import { ProfileAvatar } from '@kit/ui/profile-avatar';

type Memberships =
  Database['public']['Functions']['get_account_members']['Returns'][number];

export function AdminMembersTable(props: {
  members: Memberships[];
  whiteLabelHost?: boolean;
  slug?: string;
}) {
  return (
    <DataTable
      data={props.members}
      columns={getColumns(props.whiteLabelHost, props.slug)}
    />
  );
}

function getColumns(
  whiteLabelHost?: boolean,
  slug?: string,
): ColumnDef<Memberships>[] {
  return [
    {
      header: 'User ID',
      accessorKey: 'user_id',
      cell: ({ row }) => {
        return <span className="line-clamp-1">{row.original.user_id}</span>;
      },
    },
    {
      header: 'Name',
      cell: ({ row }) => {
        const name = row.original.name ?? row.original.email;

        return (
          <div className={'flex items-center space-x-2'}>
            <div>
              <ProfileAvatar
                pictureUrl={row.original.picture_url}
                displayName={name}
                className="size-7"
              />
            </div>

            <Link
              className={'hover:underline'}
              href={
                whiteLabelHost
                  ? `/home/${slug}/white-label/users/${row.original.id}`
                  : `/admin/users/${row.original.id}`
              }
            >
              <span>{name}</span>
            </Link>
          </div>
        );
      },
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Role',
      cell: ({ row }) => {
        return row.original.role;
      },
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
        return format(parseISO(original.updated_at), 'MMM d yyyy, h:mm a');
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
                      href={
                        whiteLabelHost
                          ? `/home/${slug}/white-label/users/${row.original.id}`
                          : `/admin/users/${row.original.id}`
                      }
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
