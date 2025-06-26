'use client';

import { useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button } from '@kit/ui/button';
import { Form, FormControl, FormField, FormItem } from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import {
  updateWhiteLabelDomainAction,
  verifyWhiteLabelDomainAction,
} from '~/lib/white-label/server-actions';

export const UpdateWhiteLabelDomainFormSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .regex(
      /^(?!https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
      'Enter a valid domain (e.g. example.com, test.example.com)',
    ),
});

export default function AddDomainForm({
  domain,
  domainVerified,
}: {
  domain: string | null;
  domainVerified: boolean;
}) {
  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(UpdateWhiteLabelDomainFormSchema),
    defaultValues: { domain: domain || '' },
  });

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['verifyWhiteLabelDomain', domain, accountId],
    queryFn: () => verifyWhiteLabelDomainAction({ domain: domain!, accountId }),
    enabled: Boolean(accountId) && Boolean(domain) && !domainVerified,
  });

  return (
    <div className={'space-y-4'}>
      <Form {...form}>
        <form
          className={'flex gap-4'}
          onSubmit={form.handleSubmit((data) => {
            startTransition(() => {
              toast.promise(
                updateWhiteLabelDomainAction({
                  domain: data.domain,
                  accountId,
                }),
                {
                  loading: 'Setting domain...',
                  success: 'Domain set! Get it verified to host your app',
                  error: 'Failed to set domain',
                },
              );
            });
          })}
        >
          <FormField
            name={'domain'}
            render={({ field }) => {
              return (
                <FormItem className="w-full max-w-sm">
                  <FormControl>
                    <Input
                      disabled={!!domain || pending}
                      required
                      placeholder="yourdomain.com"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />

          <div>
            <Button
              className={'w-full md:w-auto'}
              disabled={!!domain || pending}
            >
              Set
            </Button>
          </div>
        </form>
      </Form>
      {domain && isFetching && (
        <div className="rounded-md border px-4 py-2 text-sm">
          Verifying domain...
        </div>
      )}
      {domain && !isFetching && data?.verified === false && data.records && (
        <div className="border-border space-y-4 rounded-md border p-4 pb-2 text-sm">
          <p>
            <strong>To verify your domain</strong>, add the following DNS record
            to your domain registrar:
          </p>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{data.records.type}</TableCell>
                  <TableCell>{data.records.name}</TableCell>
                  <TableCell>{data.records.value}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => refetch()}
          >
            Verify DNS
          </Button>
        </div>
      )}
      {domain && data?.verified === true && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800">
          Domain verified! You can now use this domain for your white-label app.
          It may take a few minutes for the changes to propagate.
        </div>
      )}
      {domainVerified && !data && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800">
          Domain verified!
        </div>
      )}
    </div>
  );
}
