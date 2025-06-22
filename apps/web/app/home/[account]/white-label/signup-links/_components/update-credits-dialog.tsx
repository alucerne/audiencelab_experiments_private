'use client';

import { useTransition } from 'react';

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
import { Switch } from '@kit/ui/switch';
import { Trans } from '@kit/ui/trans';

import { CreditsFormSchema } from '~/lib/white-label/schema/credits-form.schema';
import { updateSignupLinkPermissionsAction } from '~/lib/white-label/server-actions';
import { SignupLinkData } from '~/lib/white-label/white-label.service';

export default function UpdateCreditsDialog({
  signupLink,
  children,
}: {
  signupLink: SignupLinkData;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-2xl"
      >
        <DialogHeader className="mb-4">
          <DialogTitle>Update {signupLink.name} Permissions</DialogTitle>
          <DialogDescription>
            This will not affect existing users, but will apply to new users who
            sign up using this link.
          </DialogDescription>
        </DialogHeader>

        <UpdateCreditsForm signupLink={signupLink} />
      </DialogContent>
    </Dialog>
  );
}

function UpdateCreditsForm({ signupLink }: { signupLink: SignupLinkData }) {
  const [pending, startTransition] = useTransition();

  const parsed = CreditsFormSchema.omit({ id: true }).safeParse(
    signupLink.permissions,
  );

  const form = useForm<z.infer<typeof CreditsFormSchema>>({
    defaultValues: parsed.success
      ? { ...parsed.data, id: signupLink.id }
      : {
          id: signupLink.id,
          audience_size_limit: 0,
          b2b_access: false,
          enrichment_size_limit: 0,
          intent_access: false,
          monthly_audience_limit: 0,
          max_custom_interests: 0,
          monthly_enrichment_limit: 0,
        },
    resolver: zodResolver(CreditsFormSchema),
  });

  function onSubmit(values: z.infer<typeof CreditsFormSchema>) {
    startTransition(() => {
      toast.promise(updateSignupLinkPermissionsAction(values), {
        loading: 'Updating signup link permissions...',
        success: 'Updated signup link permissions',
        error: 'Failed to update signup link permissions',
      });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <div className={'mt-6 flex justify-end space-x-2'}>
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
