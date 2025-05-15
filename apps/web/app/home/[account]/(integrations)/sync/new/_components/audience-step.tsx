import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import {
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { NewSyncFormSchema } from '~/lib/integration-app/schema/new-sync-form.schema';

import {
  getAudienceIdsAction,
  getAudienceRefreshDetailsAction,
} from '../_lib/server-actions';

export default function AudienceStep() {
  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

  const { control, setValue } =
    useFormContext<z.infer<typeof NewSyncFormSchema>>();

  const audienceId = useWatch({
    control,
    name: 'audienceId',
  });

  const {
    data: audienceIds,
    isLoading: idsLoading,
    error: idsError,
  } = useQuery({
    queryKey: ['audienceIds', accountId],
    queryFn: () => getAudienceIdsAction({ accountId }),
    enabled: Boolean(accountId),
  });

  console.log('audienceIds', audienceIds);

  const {
    data: refreshDetails,
    isLoading: refreshLoading,
    isError: refreshError,
  } = useQuery({
    queryKey: ['audienceIds', audienceId],
    queryFn: () => getAudienceRefreshDetailsAction({ audienceId }),
    enabled: Boolean(audienceId),
  });

  // when refreshDetails arrives, seed the select field
  useEffect(() => {
    if (!refreshLoading && refreshDetails) {
      const result = NewSyncFormSchema.shape.refreshInterval.safeParse(
        String(refreshDetails.refresh_interval),
      );
      if (result.success) {
        setValue('refreshInterval', result.data, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
  }, [refreshDetails, refreshLoading, setValue]);

  return (
    <>
      <FormField
        control={control}
        name="audienceId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your Audiences</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={idsLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      idsLoading ? 'Loading audiences...' : 'Select...'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {idsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : idsError ? (
                  <SelectItem value="error" disabled>
                    Error loading audiences
                  </SelectItem>
                ) : audienceIds?.length ? (
                  audienceIds.map((audience) => (
                    <SelectItem key={audience.id} value={audience.id}>
                      {audience.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-results" disabled>
                    No audiences found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {refreshDetails && refreshDetails.scheduled_refresh && (
        <div className="text-muted-foreground mb-4 space-y-1 text-sm">
          <div>
            This audience is currently scheduled to refresh every{' '}
            {refreshDetails.refresh_interval} days.
          </div>
          {refreshDetails.next_scheduled_refresh && (
            <div>
              Next Run:{' '}
              {format(parseISO(refreshDetails.next_scheduled_refresh), 'PPP p')}
            </div>
          )}
        </div>
      )}
      <FormField
        control={control}
        name="refreshInterval"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Refresh Interval</FormLabel>
            <FormDescription>
              Choose how often you want the audience to be refreshed. This
              destination will be synced with the latest data after every
              refresh.
            </FormDescription>
            <Select
              key={field.value}
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={!audienceId || refreshLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !audienceId
                        ? 'Select an audience first'
                        : refreshLoading
                          ? 'Loading refresh details...'
                          : 'Select...'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {refreshLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : refreshError ? (
                  <SelectItem value="error" disabled>
                    Error loading refresh details
                  </SelectItem>
                ) : (
                  [
                    { value: '1', label: 'Everyday' },
                    { value: '3', label: '3 Days' },
                    { value: '7', label: '7 Days' },
                    { value: '14', label: '14 Days' },
                    { value: '30', label: '30 Days' },
                  ].map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
