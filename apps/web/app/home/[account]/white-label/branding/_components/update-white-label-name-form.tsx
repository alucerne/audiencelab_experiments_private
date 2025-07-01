'use client';

import { useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button } from '@kit/ui/button';
import { Form, FormControl, FormField, FormItem } from '@kit/ui/form';
import { Input } from '@kit/ui/input';

import { updateWhiteLabelCompanyNameAction } from '~/lib/white-label/server-actions';

export const UpdateWhiteLabelNameFormSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
});

export default function UpdateWhiteLabelNameForm({ name }: { name: string }) {
  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(UpdateWhiteLabelNameFormSchema),
    defaultValues: { name },
  });

  return (
    <div className={'space-y-8'}>
      <Form {...form}>
        <form
          className={'flex gap-4'}
          onSubmit={form.handleSubmit((data) => {
            startTransition(() => {
              toast.promise(
                updateWhiteLabelCompanyNameAction({
                  name: data.name,
                  accountId,
                }),
                {
                  loading: 'Setting company name...',
                  success: 'Company name set!',
                  error: 'Failed to set company name',
                },
              );
            });
          })}
        >
          <FormField
            name={'name'}
            render={({ field }) => {
              return (
                <FormItem className="w-full max-w-sm">
                  <FormControl>
                    <Input required {...field} />
                  </FormControl>
                </FormItem>
              );
            }}
          />

          <div>
            <Button className={'w-full md:w-auto'} disabled={pending}>
              Set
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
