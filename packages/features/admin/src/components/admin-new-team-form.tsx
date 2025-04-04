'use client';

import { useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
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
import { PageBody, PageHeader } from '@kit/ui/page';
import { Separator } from '@kit/ui/separator';
import { Switch } from '@kit/ui/switch';

import { createNewTeamAction } from '../lib/server/admin-server-actions';
import { AdminNewTeamFormSchema } from '../lib/server/schema/admin-new-team-form.schema';

export default function AdminNewTeamForm({
  redirectTo,
}: {
  redirectTo: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AdminNewTeamFormSchema>>({
    resolver: zodResolver(AdminNewTeamFormSchema),
    defaultValues: {
      audience_size_limit: 500000,
      b2b_access: false,
      enrichment_size_limit: 500000,
      intent_access: false,
      max_audience_lists: 20,
      max_custom_interests: 1,
      monthly_enrichment_limit: 1,
      user_email: '',
      user_team_name: '',
      redirect_to: redirectTo,
    },
  });

  function onSubmit(values: z.infer<typeof AdminNewTeamFormSchema>) {
    if (!values.user_team_name) {
      values.user_team_name = `${values.user_email.split('@')[0]}'s Team`;
    }
    startTransition(() => {
      toast.promise(createNewTeamAction(values), {
        loading: 'Creating team and sending invite to user...',
        success: () => {
          router.push('/admin');
          return 'Team created and invite sent';
        },
        error: 'Failed to create team',
      });
    });
  }

  const emailValue = form.watch('user_email');
  const emailPrefix = emailValue?.split('@')[0] || '';
  const teamPlaceholder = emailPrefix ? `${emailPrefix}'s Team` : '';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between">
          <PageHeader title="Add New User" description={<AppBreadcrumbs />} />
          <div className="lg:px-4">
            <Button type="submit" disabled={!form.formState.isValid || pending}>
              {pending ? 'Updating...' : 'Invite User & Create Team'}
            </Button>
          </div>
        </div>
        <PageBody className="space-y-6">
          <h2 className="text-lg font-semibold">User Information</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <FormField
              control={form.control}
              name="user_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    The email address of the user to invite
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="user_team_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={teamPlaceholder} />
                  </FormControl>
                  <FormDescription>
                    This will be the user&apos;s initial team name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Separator />
          <h2 className="text-lg font-semibold">Team Permissions</h2>
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
        </PageBody>
      </form>
    </Form>
  );
}
