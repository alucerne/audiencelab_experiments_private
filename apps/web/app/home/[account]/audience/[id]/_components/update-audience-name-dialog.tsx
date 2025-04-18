'use client';

import { useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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

import { audienceNameFormSchema } from '~/lib/audience/schema/audience-name-form.schema';
import { updateAudienceNameAction } from '~/lib/audience/server-actions';

export default function UpdateAudienceNameDialog({
  audienceName,
  audienceId,
}: {
  audienceName: string;
  audienceId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-7"
        >
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Update Audience Name</DialogTitle>
        </DialogHeader>

        <UpdateAudienceNameForm
          audienceId={audienceId}
          audienceName={audienceName}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function UpdateAudienceNameForm(props: {
  audienceId: string;
  audienceName: string;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof audienceNameFormSchema>>({
    defaultValues: {
      name: props.audienceName,
    },
    resolver: zodResolver(audienceNameFormSchema),
  });

  function onSubmit(values: z.infer<typeof audienceNameFormSchema>) {
    startTransition(async () => {
      try {
        await updateAudienceNameAction({
          audienceId: props.audienceId,
          name: values.name,
        });

        props.onSuccess?.();
      } catch {
        toast.error(
          'Failed to create audience. Please try again or reach out to support.',
        );
      }
    });
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
              {!pending ? 'Update' : <Spinner className="mx-2.5 size-4" />}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
