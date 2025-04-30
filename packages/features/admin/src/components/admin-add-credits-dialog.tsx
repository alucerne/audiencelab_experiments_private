'use client';

import { useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Tables } from '@kit/supabase/database';
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
import { Trans } from '@kit/ui/trans';

import { updateTeamUsageAction } from '../lib/server/admin-server-actions';
import { AdminUsageFormSchema } from '../lib/server/schema/admin-usage-form.schema';

export default function AdminAddCreditsDialog({
  credits,
}: {
  credits: Tables<'credits'>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          Update Current Credits
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Update Current Credits</DialogTitle>
          <DialogDescription>
            This is the user&apos;s current usage. Lower these values to allow
            the user to create more resources.
          </DialogDescription>
        </DialogHeader>

        <AdminAddCreditsForm credits={credits} setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}

function AdminAddCreditsForm({
  credits,
  setOpen,
}: {
  credits: Tables<'credits'>;
  setOpen: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AdminUsageFormSchema>>({
    resolver: zodResolver(AdminUsageFormSchema),
    defaultValues: {
      id: credits.id,
      current_audience: credits.current_audience,
      current_enrichment: credits.current_enrichment,
      current_custom: credits.current_custom,
    },
  });

  function onSubmit(values: z.infer<typeof AdminUsageFormSchema>) {
    startTransition(() => {
      toast.promise(updateTeamUsageAction(values), {
        loading: 'Updating usage...',
        success: () => {
          setOpen(false);
          return 'Usage updated';
        },
        error: 'Failed to update usage',
      });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="current_audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Audiences</FormLabel>
              <FormControl>
                <Input type="number" className="max-w-xs" {...field} />
              </FormControl>
              <FormDescription>
                Current number of audiences in use for this calendar month
                <br />
                <em className="text-muted-foreground text-sm">
                  Original: {credits.current_audience}
                </em>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="current_enrichment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Enrichments</FormLabel>
              <FormControl>
                <Input type="number" className="max-w-xs" {...field} />
              </FormControl>
              <FormDescription>
                Current number of enrichments uploaded for this calendar month
                <br />
                <em className="text-muted-foreground text-sm">
                  Original: {credits.current_enrichment}
                </em>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="current_custom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Custom Interests</FormLabel>
              <FormControl>
                <Input type="number" className="max-w-xs" {...field} />
              </FormControl>
              <FormDescription>
                Total number of custom interests created by this account
                <br />
                <em className="text-muted-foreground text-sm">
                  Original: {credits.current_custom}
                </em>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
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
            Update
          </Button>
        </div>
      </form>
    </Form>
  );
}
