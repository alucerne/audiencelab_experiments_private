'use client';

import { useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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

import { setAudienceWebhookAction } from '~/lib/audience/server-actions';
import { Tables } from '~/lib/database.types';

import { testWebhookUrlAction } from '../../_lib/server/actions';

const audienceWebhookSchema = z.object({
  webhookUrl: z.string().trim().url(),
});

export default function AudienceWebhookDialog({
  audience,
  children,
}: {
  audience: Tables<'audience'>;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Add Webhook {audience.name} Audience</DialogTitle>
          <DialogDescription>
            Connect your services to receive real-time updates when the audience
            lists are ready.
          </DialogDescription>
        </DialogHeader>

        <AudienceWebhookForm audience={audience} setIsOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
}

function AudienceWebhookForm({
  audience,
  setIsOpen,
}: {
  audience: Tables<'audience'>;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof audienceWebhookSchema>>({
    defaultValues: { webhookUrl: audience.webhook_url ?? '' },
    resolver: zodResolver(audienceWebhookSchema),
  });

  function onSubmit(values: z.infer<typeof audienceWebhookSchema>) {
    startTransition(() => {
      toast.promise(
        setAudienceWebhookAction({
          audienceId: audience.id,
          webhookUrl: values.webhookUrl,
        }),
        {
          loading: 'Adding audience webhook...',
          success: () => {
            setIsOpen(false);
            return 'Audience webhook added';
          },
          error: 'Failed to add webhook',
        },
      );
    });
  }

  function handleDelete() {
    startTransition(() => {
      toast.promise(
        setAudienceWebhookAction({
          audienceId: audience.id,
          webhookUrl: null,
        }),
        {
          loading: 'Deleting audience webhook...',
          success: () => {
            setIsOpen(false);
            return 'Audience webhook deleted';
          },
          error: 'Failed to delete webhook',
        },
      );
    });
  }

  async function handleTest() {
    const webhookUrl = form.getValues('webhookUrl');
    if (!webhookUrl) {
      toast.error('Please provide a webhook URL to test.');
      return;
    }

    startTransition(() => {
      toast.promise(testWebhookUrlAction({ webhookUrl }), {
        loading: 'Testing webhook URL...',
        success: 'Webhook URL is valid',
        error: 'Failed to reach webhook URL',
      });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col space-y-6">
          <FormField
            control={form.control}
            name="webhookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook URL</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input {...field} />
                    <Button
                      type="button"
                      onClick={handleTest}
                      disabled={!form.formState.isValid || pending}
                    >
                      Test
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            {audience.webhook_url ? (
              <Button
                variant="destructive"
                size="sm"
                type="button"
                disabled={pending}
                onClick={handleDelete}
              >
                Delete
              </Button>
            ) : (
              <DialogClose asChild>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={pending}
                >
                  <Trans i18nKey="common:cancel" />
                </Button>
              </DialogClose>
            )}
            <Button size="sm" disabled={pending}>
              Add
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
