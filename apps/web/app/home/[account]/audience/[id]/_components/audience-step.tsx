import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Path, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Textarea } from '@kit/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@kit/ui/toggle-group';

import AsyncMultiSelect from '~/components/ui/async-multi-select';
import CreatableInput from '~/components/ui/creatable-input';
import {
  AudienceFiltersFormValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';

import {
  getCustomInterestsAction,
  searchPremadeListsAction,
} from '../_lib/server-actions';

export const audienceFields = [
  'audience',
  'segment',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

export default function AudienceStep() {
  const { control, watch, resetField } =
    useFormContext<z.infer<typeof audienceFiltersFormSchema>>();

  const audienceType = watch('audience.type');
  const b2b = watch('audience.b2b');

  const previousAudienceTypeRef = useRef(audienceType);

  useEffect(() => {
    if (previousAudienceTypeRef.current !== audienceType) {
      resetField('segment');
      resetField('audience.customTopic');
      resetField('audience.customDescription');
      previousAudienceTypeRef.current = audienceType;
    }
  }, [audienceType, resetField]);

  const searchWithBusinessType = useCallback(
    (search: string) =>
      searchPremadeListsAction({
        search,
        b2b,
      }),
    [b2b],
  );

  return (
    <>
      <FormField
        control={control}
        name="audience.type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Audience Method</FormLabel>
            <FormDescription>
              Select the method you want to use to create your audience.
            </FormDescription>
            <FormControl>
              <ToggleGroup
                type="single"
                variant="outline"
                value={field.value}
                onValueChange={(value) => {
                  if (value) {
                    field.onChange(value);
                  }
                }}
                className="mt-1.5 justify-start"
              >
                <ToggleGroupItem value="premade" className="px-3 py-1">
                  Premade
                </ToggleGroupItem>
                <ToggleGroupItem value="keyword" className="px-3 py-1">
                  Keyword
                </ToggleGroupItem>
                <ToggleGroupItem value="custom" className="px-3 py-1">
                  Custom
                </ToggleGroupItem>
              </ToggleGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {audienceType !== 'custom' ? (
        <>
          <FormField
            control={control}
            name="audience.b2b"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type</FormLabel>
                <FormDescription>
                  Select the type of business you are targeting.
                </FormDescription>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.value ? 'B2B' : 'B2C'}
                    onValueChange={(value) => {
                      if (value) {
                        field.onChange(value === 'B2B');
                      }
                    }}
                    className="mt-1.5 justify-start"
                  >
                    <ToggleGroupItem value="B2B" className="px-3 py-1">
                      B2B
                    </ToggleGroupItem>
                    <ToggleGroupItem value="B2C" className="px-3 py-1">
                      B2C
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {audienceType === 'premade' ? (
            <FormField
              control={control}
              name="segment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What interests does your audience have?</FormLabel>
                  <FormDescription>
                    Search and select a premade list.
                  </FormDescription>
                  <FormControl>
                    <AsyncMultiSelect
                      value={field.value}
                      onChange={(selected) => field.onChange(selected)}
                      searchAction={searchWithBusinessType}
                      debounceTime={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : audienceType === 'keyword' ? (
            <FormField
              control={control}
              name="segment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What interests does your audience have?</FormLabel>
                  <FormDescription>
                    Build your own audience based on search terms.
                  </FormDescription>
                  <FormControl>
                    <CreatableInput
                      value={field.value}
                      onChange={(newValue) => field.onChange(newValue)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </>
      ) : (
        <CustomAudience />
      )}
    </>
  );
}

function CustomAudience() {
  //  const [pending, startTransition] = useTransition();

  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

  const { control, resetField } =
    useFormContext<z.infer<typeof audienceFiltersFormSchema>>();
  const [isNew, setIsNew] = useState<'existing' | 'new'>('existing');

  const { data, isLoading, error } = useQuery({
    queryKey: ['customInterests', accountId],
    queryFn: () => getCustomInterestsAction({ accountId }),
    enabled: Boolean(accountId),
  });

  useEffect(() => {
    resetField('segment');
    resetField('audience.customTopic');
    resetField('audience.customDescription');
  }, [isNew, resetField]);

  //create button shows toast switches back to existing view, invalidates query, resets fields

  // function handleCreate() {
  //   //!validate custom fields

  //   startTransition(() => {
  //     toast.promise(
  //       addAudienceFiltersAction({
  //         accountId,
  //         audienceId: id,
  //         filters: values,
  //       }),
  //       {
  //         loading: 'Creating custom audience...',
  //         success: () => {
  //           setIsNew('existing');
  //           queryClient.invalidateQueries('customInterests');
  //           resetField('audience.customTopic');
  //           resetField('audience.customDescription');
  //           return 'Your custom audience is being created. This process can take up to 24 hours.';
  //         },
  //         error: 'Failed to create custom audience',
  //       },
  //     );
  //   });
  // }

  return (
    <>
      <FormItem>
        <FormLabel>Manage Your Custom Audiences</FormLabel>
        <FormDescription>Use or create a custom audience.</FormDescription>
        <ToggleGroup
          type="single"
          variant="outline"
          value={isNew}
          onValueChange={(value) => setIsNew(value as 'existing' | 'new')}
          className="mt-1.5 justify-start"
        >
          <ToggleGroupItem value="existing" className="px-3 py-1">
            Existing
          </ToggleGroupItem>
          <ToggleGroupItem value="new" className="px-3 py-1">
            New
          </ToggleGroupItem>
        </ToggleGroup>
      </FormItem>
      {isNew === 'new' ? (
        <>
          <FormField
            control={control}
            name="audience.customTopic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic</FormLabel>
                <FormDescription>
                  What is the topic of your custom audience?
                </FormDescription>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="audience.customDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormDescription>
                  Describe your custom audience.
                </FormDescription>
                <FormControl>
                  <Textarea {...field} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button onClick={() => setIsNew('existing')}>Cancel</Button>
        </>
      ) : (
        <FormField
          control={control}
          name="segment"
          render={({ field }) => (
            <FormItem className="gap-y-4">
              <FormLabel>Your Ready Custom Audiences</FormLabel>
              <Select
                onValueChange={(val) => field.onChange([val])}
                defaultValue={field.value?.[0] || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : error ? (
                    <SelectItem value="error" disabled>
                      Error loading custom audiences
                    </SelectItem>
                  ) : data?.length ? (
                    data.map((interest, index) => (
                      <SelectItem
                        key={index}
                        value={interest.topic_id}
                        disabled={!interest.available}
                      >
                        {interest.topic}
                        <Badge className="ml-6" variant={'info'}>
                          {interest.available
                            ? `Created on ${format(new Date(interest.created_at), 'MMM dd, yyyy')}`
                            : 'Processing'}
                        </Badge>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-results" disabled>
                      No custom audiences found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
