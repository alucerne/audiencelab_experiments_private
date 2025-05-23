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

import { Tables } from '~/lib/database.types';
import { setPixelWebhookAction } from '~/lib/pixel/server-actions';

import { testWebhookUrlAction } from '../../_lib/actions';

const pixelWebhookSchema = z.object({
  webhookUrl: z.string().trim().url(),
});

export default function PixelWebhookDialog({
  pixel,
  children,
}: {
  pixel: Tables<'pixel'>;
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
          <DialogTitle>Edit Webhook</DialogTitle>
          <DialogDescription>
            Connect your services to receive real-time updates when new pixel
            resolutions are ready.
          </DialogDescription>
        </DialogHeader>

        <PixelWebhookForm pixel={pixel} setIsOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
}

function PixelWebhookForm({
  pixel,
  setIsOpen,
}: {
  pixel: Tables<'pixel'>;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof pixelWebhookSchema>>({
    defaultValues: { webhookUrl: pixel.webhook_url ?? '' },
    resolver: zodResolver(pixelWebhookSchema),
  });

  function onSubmit(values: z.infer<typeof pixelWebhookSchema>) {
    startTransition(() => {
      toast.promise(
        setPixelWebhookAction({
          pixelId: pixel.id,
          webhookUrl: values.webhookUrl,
        }),
        {
          loading: 'Adding pixel webhook...',
          success: () => {
            setIsOpen(false);
            return 'Pixel webhook added';
          },
          error: 'Failed to add webhook',
        },
      );
    });
  }

  function handleDelete() {
    startTransition(() => {
      toast.promise(
        setPixelWebhookAction({
          pixelId: pixel.id,
          webhookUrl: null,
        }),
        {
          loading: 'Deleting pixel webhook...',
          success: () => {
            setIsOpen(false);
            return 'Pixel webhook deleted';
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
            {pixel.webhook_url ? (
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
