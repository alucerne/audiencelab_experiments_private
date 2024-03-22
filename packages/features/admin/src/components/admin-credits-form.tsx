'use client';

import { useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Tables } from '@kit/supabase/database';
import { Button } from '@kit/ui/button';
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
import { Switch } from '@kit/ui/switch';

import { updateTeamPermissionsAction } from '../lib/server/admin-server-actions';
import { AdminCreditsFormSchema } from '../lib/server/schema/admin-credits-form.schema';

export default function AdminCreditsForm({
  credits,
}: {
  credits: Tables<'credits'>;
}) {
  const [pending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AdminCreditsFormSchema>>({
    resolver: zodResolver(AdminCreditsFormSchema),
    defaultValues: {
      id: credits.id,
      audience_size_limit: credits.audience_size_limit,
      b2b_access: credits.b2b_access,
      enrichment_size_limit: credits.enrichment_size_limit,
      intent_access: credits.intent_access,
      max_audience_lists: credits.max_audience_lists,
      max_custom_interests: credits.max_custom_interests,
      monthly_enrichment_limit: credits.monthly_enrichment_limit,
    },
  });

  function onSubmit(values: z.infer<typeof AdminCreditsFormSchema>) {
    startTransition(() => {
      toast.promise(updateTeamPermissionsAction(values), {
        loading: 'Updating permissions...',
        success: 'Permissions updated',
        error: 'Failed to update permissions',
      });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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
            name="max_audience_lists"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Audience Lists</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Maximum number of audience lists allowed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_custom_interests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Custom Interests</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Maximum number of custom interests allowed
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
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Updating...' : 'Update Permissions'}
        </Button>
      </form>
    </Form>
  );
}
