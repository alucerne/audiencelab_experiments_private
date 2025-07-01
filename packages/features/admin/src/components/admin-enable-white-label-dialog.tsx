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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Spinner } from '@kit/ui/spinner';
import { Switch } from '@kit/ui/switch';
import { Trans } from '@kit/ui/trans';

import { enableWhiteLabelAction } from '../lib/server/admin-server-actions';
import { AdminCreditsSchema } from '../lib/server/schema/admin-credits-form.schema';

export default function AdminEnableWhiteLabelDialog({
  accountId,
}: {
  accountId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-fit">Enable</Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Enable White-label</DialogTitle>
          <DialogDescription>
            Configure the white-label settings for this account. The white-label
            host will allocate these credits to the teams that sign up under
            this account.
          </DialogDescription>
        </DialogHeader>

        <EnableWhiteLabelForm accountId={accountId} />
      </DialogContent>
    </Dialog>
  );
}

function EnableWhiteLabelForm({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AdminCreditsSchema>>({
    resolver: zodResolver(AdminCreditsSchema),
    defaultValues: {
      audience_size_limit: 500000,
      b2b_access: false,
      enrichment_size_limit: 500000,
      intent_access: false,
      monthly_audience_limit: 20,
      max_custom_interests: 1,
      monthly_enrichment_limit: 1,
      pixel_size_limit: 1000000,
      monthly_pixel_limit: 3,
    },
  });

  function onSubmit(values: z.infer<typeof AdminCreditsSchema>) {
    startTransition(() => {
      toast.promise(
        enableWhiteLabelAction({
          permissions: values,
          accountId,
        }),
        {
          loading: 'Enabling white-label...',
          success: 'White-label enabled!',
          error: 'Failed to enable white-label',
        },
      );
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <FormField
            control={form.control}
            name="monthly_audience_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Audience Limit</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Maximum audience lists allowed per month
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="monthly_enrichment_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Enrichment Limit</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Maximum enrichments allowed per month
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="monthly_pixel_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Pixel Limit</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Maximum pixels allowed per month
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="audience_size_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience Size Limit</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Maximum number of contacts in an audience
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="enrichment_size_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enrichment Size Limit</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Maximum records per enrichment batch
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pixel_size_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pixel Resolution Limit</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Maximum resolutions per pixel</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_custom_interests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Custom Intents</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Maximum number of custom intents allowed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="b2b_access"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">B2B Access</FormLabel>
                  <FormDescription>
                    Enable access to B2B features
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="intent_access"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Intent Access</FormLabel>
                  <FormDescription>
                    Enable access to intent data features
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
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
            {!pending ? 'Enable' : <Spinner className="mx-2.5 size-4" />}
          </Button>
        </div>
      </form>
    </Form>
  );
}
