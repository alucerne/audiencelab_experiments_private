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
import { Spinner } from '@kit/ui/spinner';
import { Trans } from '@kit/ui/trans';

import { createAudienceAction } from '~/lib/audience/server-actions';

const addAudienceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
});

export default function AddAudienceDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-fit">Create</Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Create Audience</DialogTitle>
        </DialogHeader>

        <AddAudienceForm />
      </DialogContent>
    </Dialog>
  );
}

function AddAudienceForm(props: { onClose?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    account: { slug, id },
  } = useTeamAccountWorkspace();

  const form = useForm<z.infer<typeof addAudienceSchema>>({
    defaultValues: {
      name: '',
    },
    resolver: zodResolver(addAudienceSchema),
  });

  function onSubmit(values: z.infer<typeof addAudienceSchema>) {
    startTransition(async () => {
      try {
        const { id: audienceId } = await createAudienceAction({
          accountId: id,
          name: values.name,
        });

        router.push(`/home/${slug}/audience/${audienceId}`);
      } catch {
        toast.error(
          'Failed to create audience. Please try again or reach out to support.',
        );
      }
    });

    props.onClose?.();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className={'flex flex-col space-y-4'}>
          <FormField
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
              {!pending ? 'Create' : <Spinner className="mx-2.5 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
