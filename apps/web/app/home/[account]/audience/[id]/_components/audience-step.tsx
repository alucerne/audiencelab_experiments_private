import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Path, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
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
  createCustomInterestAction,
  getCustomInterestsAction,
  searchPremadeListsAction,
} from '../_lib/server-actions';

export const audienceFields = [
  'audience',
  'segment',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

export default function AudienceStep({
  limits,
}: {
  limits: {
    canCreateCustomInterests: boolean;
    b2bAccess: boolean;
  };
}) {
  const { control, watch, resetField } =
    useFormContext<z.infer<typeof audienceFiltersFormSchema>>();

  const audienceType = watch('audience.type');
  const b2b = watch('audience.b2b');

  const previousAudienceTypeRef = useRef(audienceType);
  const previousB2BRef = useRef(b2b);

  useEffect(() => {
    if (previousAudienceTypeRef.current !== audienceType) {
      resetField('segment');
      resetField('audience.customTopic');
      resetField('audience.customDescription');
      previousAudienceTypeRef.current = audienceType;
    }
  }, [audienceType, resetField]);

  useEffect(() => {
    if (previousB2BRef.current !== b2b) {
      resetField('segment');
      previousB2BRef.current = b2b;
    }
  }, [b2b, resetField]);

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
                  if (value !== undefined && value !== '') {
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
                    <ToggleGroupItem value="B2C" className="px-3 py-1">
                      B2C
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="B2B"
                      disabled={!limits.b2bAccess}
                      className="px-3 py-1"
                    >
                      B2B
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
        <CustomAudience canCreate={limits.canCreateCustomInterests} />
      )}
    </>
  );
}

function CustomAudience({ canCreate }: { canCreate: boolean }) {
  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

  const { control } =
    useFormContext<z.infer<typeof audienceFiltersFormSchema>>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['customInterests', accountId],
    queryFn: () => getCustomInterestsAction({ accountId }),
    enabled: Boolean(accountId),
  });

  const segment = useWatch({ control, name: 'segment' });

  const selectedInterest = data?.find((i) => i.topic_id === segment?.[0]);

  return (
    <>
      <FormField
        control={control}
        name="segment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your Custom Intents</FormLabel>
            <FormDescription>
              Select a custom intent you have created.
            </FormDescription>
            <Select
              onValueChange={(val) => field.onChange([val])}
              defaultValue={field.value?.[0] || ''}
            >
              <FormControl>
                <SelectTrigger className="[&_p]:hidden">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : error ? (
                  <SelectItem value="error" disabled>
                    Error loading custom intents
                  </SelectItem>
                ) : data?.length ? (
                  data
                    .slice()
                    .sort((a, b) =>
                      a.status === b.status ? 0 : a.status === 'ready' ? -1 : 1,
                    )
                    .map((interest, index) => (
                      <SelectItem
                        key={index}
                        value={interest.topic_id}
                        disabled={interest.status !== 'ready'}
                        className="py-2 [&>span:nth-child(2)]:flex [&>span:nth-child(2)]:w-full [&>span:nth-child(2)]:min-w-0 [&>span:nth-child(2)]:flex-1 [&>span:nth-child(2)]:flex-col"
                      >
                        <div className="flex items-center gap-6">
                          <div
                            className="truncate"
                            style={{
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              wordBreak: 'break-word',
                              hyphens: 'auto',
                            }}
                          >
                            {interest.topic || interest.description}
                          </div>
                          <Badge
                            variant={
                              interest.status !== 'rejected'
                                ? 'info'
                                : 'destructive'
                            }
                            className="whitespace-nowrap"
                          >
                            {interest.status === 'ready'
                              ? `Created on ${format(new Date(interest.created_at), 'MMM dd, yyyy')}`
                              : interest.status === 'processing'
                                ? 'Processing...'
                                : 'Rejected'}
                          </Badge>
                        </div>
                        <p
                          className="text-muted-foreground mt-1 line-clamp-3 text-xs"
                          style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            hyphens: 'auto',
                          }}
                        >
                          {interest.description}
                        </p>
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem value="no-results" disabled>
                    No custom intents found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {selectedInterest && (
        <div className="bg-muted rounded-md px-4 py-2">
          <p
            className="text-muted-foreground text-xs"
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              hyphens: 'auto',
            }}
          >
            {selectedInterest.description}
          </p>
        </div>
      )}
      <CreateCustomAudienceDialog disabled={!canCreate} />
    </>
  );
}

function CreateCustomAudienceDialog({ disabled }: { disabled: boolean }) {
  const { control, getValues, setError, clearErrors, reset } =
    useFormContext<AudienceFiltersFormValues>();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

  function resetDialogFields() {
    reset({
      ...getValues(),
      audience: {
        ...getValues().audience,
        customTopic: '',
        customDescription: '',
      },
    });
    clearErrors(['audience.customTopic', 'audience.customDescription']);
  }

  function handleClose() {
    setOpen(false);
    resetDialogFields();
  }

  function validateCustomFields() {
    let isValid = true;

    const topic = getValues('audience.customTopic');
    if (!topic || topic.trim().length === 0) {
      setError('audience.customTopic', {
        type: 'manual',
        message: 'Topic is required',
      });
      isValid = false;
    }

    const description = getValues('audience.customDescription');
    if (!description || description.trim().length === 0) {
      setError('audience.customDescription', {
        type: 'manual',
        message: 'Description is required',
      });
      isValid = false;
    }

    return isValid;
  }

  function handleCreate() {
    clearErrors(['audience.customTopic', 'audience.customDescription']);

    if (!validateCustomFields()) {
      return;
    }

    startTransition(() => {
      toast.promise(
        createCustomInterestAction({
          accountId,
          topic: getValues('audience.customTopic'),
          description: getValues('audience.customDescription'),
        }),
        {
          loading: 'Creating custom intent...',
          success: () => {
            queryClient.invalidateQueries({
              queryKey: ['customInterests', accountId],
            });
            handleClose();
            return 'Your custom intent is being created. This process can take up to 72 hours.';
          },
          error: 'Failed to create custom intent',
        },
      );
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetDialogFields();
        }
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled} size="sm" className="w-fit gap-2 text-sm">
          New Custom Intent
        </Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="flex max-h-[90vh] max-w-xl flex-col overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Create Custom Intent</DialogTitle>
        </DialogHeader>
        <FormField
          control={control}
          name="audience.customTopic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel>
              <FormDescription>
                What is the topic of your custom intent?
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
            <FormItem className="mt-2">
              <FormLabel>Description</FormLabel>
              <FormDescription>Describe your custom intent.</FormDescription>
              <FormControl>
                <Textarea {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={pending}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button size="sm" disabled={pending} onClick={handleCreate}>
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
