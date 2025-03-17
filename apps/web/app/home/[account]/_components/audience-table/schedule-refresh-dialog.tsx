import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { differenceInMinutes } from 'date-fns';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Separator } from '@kit/ui/separator';

import { AudienceList } from '~/lib/audience/audience.service';
import { audienceFiltersFormSchema } from '~/lib/audience/schema/audience-filters-form.schema';
import {
  addAudienceFiltersAction,
  scheduleAudienceRefreshAction,
} from '~/lib/audience/server-actions';

export default function ScheduleRefreshDialog({
  children,
  audience,
}: {
  children: React.ReactNode;
  audience: AudienceList;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'refresh' | 'schedule' | null
  >(null);

  async function handleRefresh() {
    setPendingAction('refresh');
    toast.promise(
      async () => {
        const filters = audienceFiltersFormSchema.parse(audience.filters);
        return await addAudienceFiltersAction({
          accountId: audience.account_id,
          audienceId: audience.id,
          filters,
        });
      },
      {
        loading: 'Refreshing...',
        success: () => {
          setIsOpen(false);
          setPendingAction(null);
          return 'Refresh job has been queued successfully.';
        },
        error: () => {
          setPendingAction(null);
          return 'Failed to queue audience refresh.';
        },
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Refresh Audience</DialogTitle>
        </DialogHeader>

        <ScheduleForm
          audience={audience}
          setIsOpen={setIsOpen}
          pendingAction={pendingAction}
          setPendingAction={setPendingAction}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background text-muted-foreground px-2">Or</span>
          </div>
        </div>

        <Button
          disabled={
            (audience.latest_job.status !== 'COMPLETED' &&
              audience.latest_job.created_at &&
              differenceInMinutes(
                new Date(),
                new Date(audience.latest_job.created_at),
              ) < 5) ||
            !!pendingAction
          }
          onClick={handleRefresh}
          variant="secondary"
        >
          {pendingAction === 'refresh' ? 'Refreshing...' : 'Refresh Now'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

const scheduleFormSchema = z.object({
  interval: z.enum(['1', '3', '7', '14', '30']),
});

function ScheduleForm({
  audience,
  setIsOpen,
  pendingAction,
  setPendingAction,
}: {
  audience: AudienceList;
  setIsOpen: (isOpen: boolean) => void;
  pendingAction: 'refresh' | 'schedule' | null;
  setPendingAction: React.Dispatch<
    React.SetStateAction<'refresh' | 'schedule' | null>
  >;
}) {
  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      interval: '7',
    },
  });

  async function onSubmit(values: z.infer<typeof scheduleFormSchema>) {
    setPendingAction('schedule');
    toast.promise(
      scheduleAudienceRefreshAction({
        accountId: audience.account_id,
        audienceId: audience.id,
        interval: values.interval,
      }),
      {
        loading: 'Scheduling...',
        success: () => {
          setIsOpen(false);
          setPendingAction(null);
          return 'Audience refresh scheduled successfully';
        },
        error: () => {
          setPendingAction(null);
          return 'Failed to schedule audience refresh';
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="interval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Refresh Interval</FormLabel>
              <FormDescription>
                Choose how often you want the audience to be refreshed.
              </FormDescription>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {[
                      { value: '1', label: 'Everyday' },
                      { value: '3', label: '3 Days' },
                      { value: '7', label: '7 Days' },
                      { value: '14', label: '14 Days' },
                      { value: '30', label: '30 Days' },
                    ].map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={
            (audience.latest_job.status !== 'COMPLETED' &&
              audience.latest_job.created_at &&
              differenceInMinutes(
                new Date(),
                new Date(audience.latest_job.created_at),
              ) < 5) ||
            !!pendingAction
          }
          className="w-full"
        >
          {pendingAction === 'schedule' ? 'Scheduling...' : 'Schedule'}
        </Button>
      </form>
    </Form>
  );
}
