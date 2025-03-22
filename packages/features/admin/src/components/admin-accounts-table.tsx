'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Database } from '@kit/supabase/database';
import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { DataTable } from '@kit/ui/enhanced-data-table';
import { Form, FormControl, FormField, FormItem } from '@kit/ui/form';
import { If } from '@kit/ui/if';
import { Input } from '@kit/ui/input';

import { AdminDeleteAccountDialog } from './admin-delete-account-dialog';
import { AdminDeleteUserDialog } from './admin-delete-user-dialog';
import { AdminImpersonateUserDialog } from './admin-impersonate-user-dialog';

type Account = Database['public']['Tables']['accounts']['Row'];

const FiltersSchema = z.object({
  query: z.string().optional(),
});

export function AdminAccountsTable(
  props: React.PropsWithChildren<{
    data: Account[];
    pageCount: number;
    pageSize: number;
    page: number;
    isPersonal: boolean;
  }>,
) {
  return (
    <div className={'flex flex-col space-y-4'}>
      <div className={'flex justify-between items-center'}>
        <h1 className={'text-xl font-semibold'}>
          {props.isPersonal ? 'Personal Accounts' : 'Team Accounts'}
        </h1>

        <AccountsTableFilters />
      </div>

      <DataTable
        pageSize={props.pageSize}
        pageIndex={props.page - 1}
        pageCount={props.pageCount}
        data={props.data}
        columns={getColumns(props.isPersonal)}
      />
    </div>
  );
}

function AccountsTableFilters() {
  const form = useForm({
    resolver: zodResolver(FiltersSchema),
    defaultValues: {
      // type: props.filters?.type ?? 'all',
      query: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const router = useRouter();
  const pathName = usePathname();

  const onSubmit = ({ query }: z.infer<typeof FiltersSchema>) => {
    const params = new URLSearchParams({
      query: query ?? '',
    });

    const url = `${pathName}?${params.toString()}`;

    router.push(url);
  };

  return (
    <Form {...form}>
      <form
        className={'flex gap-2.5'}
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
      >
        <FormField
          name={'query'}
          render={({ field }) => (
            <FormItem>
              <FormControl className={'w-full min-w-36 md:min-w-80'}>
                <Input
                  className={'w-full'}
                  placeholder={`Search account...`}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

function getColumns(isPersonal?: boolean): ColumnDef<Account>[] {
  return [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => {
        return (
          <Link
            className={'hover:underline'}
            href={`/admin/users/${row.original.id}`}
          >
            {row.original.name}
          </Link>
        );
      },
    },
    ...(isPersonal
      ? [
          {
            id: 'email',
            header: 'Email',
            accessorKey: 'email',
          },
        ]
      : []),
    {
      id: 'created_at',
      header: 'Created At',
      accessorKey: 'created_at',
    },
    {
      id: 'updated_at',
      header: 'Updated At',
      accessorKey: 'updated_at',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const isPersonalAccount = row.original.is_personal_account;
        const userId = row.original.id;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={'ghost'}>
                  <EllipsisVertical className={'h-4'} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align={'end'}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>

                  <DropdownMenuItem>
                    <Link
                      className={'h-full w-full'}
                      href={`/admin/users/${userId}`}
                    >
                      View
                    </Link>
                  </DropdownMenuItem>

                  <If condition={isPersonalAccount}>
                    <AdminImpersonateUserDialog userId={userId}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Impersonate User
                      </DropdownMenuItem>
                    </AdminImpersonateUserDialog>

                    <AdminDeleteUserDialog userId={userId}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Delete Personal Account
                      </DropdownMenuItem>
                    </AdminDeleteUserDialog>
                  </If>

                  <If condition={!isPersonalAccount}>
                    <AdminDeleteAccountDialog accountId={row.original.id}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Delete Team Account
                      </DropdownMenuItem>
                    </AdminDeleteAccountDialog>
                  </If>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
