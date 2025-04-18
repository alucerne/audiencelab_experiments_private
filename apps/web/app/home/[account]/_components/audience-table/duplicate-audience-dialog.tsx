'use client';

import { useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Trans } from '@kit/ui/trans';

import { audienceNameFormSchema } from '~/lib/audience/schema/audience-name-form.schema';
import { duplicateAudienceAction } from '~/lib/audience/server-actions';
import { Tables } from '~/lib/database.types';

export default function DuplicateAudienceDialog({
  audience,
  children,
}: {
  audience: Tables<'audience'>;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Duplicate {audience.name} Audience</DialogTitle>
        </DialogHeader>

        <DuplicateAudienceForm audience={audience} />
      </DialogContent>
    </Dialog>
  );
}

function DuplicateAudienceForm({ audience }: { audience: Tables<'audience'> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    account: { slug },
  } = useTeamAccountWorkspace();

  const form = useForm<z.infer<typeof audienceNameFormSchema>>({
    defaultValues: {
      name: '',
    },
    resolver: zodResolver(audienceNameFormSchema),
  });

  function onSubmit(values: z.infer<typeof audienceNameFormSchema>) {
    startTransition(() => {
      toast.promise(
        duplicateAudienceAction({
          originalId: audience.id,
          newName: values.name,
        }),
        {
          loading: 'Duplicating audience...',
          success: (audience) => {
            router.push(`/home/${slug}/audience/${audience.id}`);

            return 'Audience duplicated';
          },
          error: 'Failed to duplicate audience',
        },
      );
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className={'flex flex-col space-y-4'}>
          <FormField
            control={form.control}
            name={'name'}
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      minLength={2}
                      maxLength={50}
                      placeholder={''}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <div className={'flex justify-end space-x-2'}>
            <DialogClose asChild>
              <Button
                variant={'outline'}
                size="sm"
                type={'button'}
                disabled={pending}
              >
                <Trans i18nKey={'common:cancel'} />
              </Button>
            </DialogClose>
            <Button size="sm" disabled={pending}>
              Duplicate
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
