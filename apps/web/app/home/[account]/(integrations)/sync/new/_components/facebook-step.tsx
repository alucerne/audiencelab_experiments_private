import { useState } from 'react';

import { useIntegrationApp } from '@integration-app/react';
import { useQueryClient } from '@tanstack/react-query';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import {
  FormControl,
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

import { NewSyncFormSchema } from '~/lib/integration-app/schema/new-sync-form.schema';

import { useAdAccounts } from '../_lib/hooks/use-ad-accounts';
import { useAudiences } from '../_lib/hooks/use-audiences';

export default function FacebookStep() {
  const [pending, setPending] = useState(false);

  const { control, setValue } =
    useFormContext<z.infer<typeof NewSyncFormSchema>>();
  const fbAdAccountId = useWatch({
    control,
    name: 'integration.fbAdAccountId',
  });

  console.log('fbAdAccountId', fbAdAccountId);

  const { adAccounts, isLoading: loadingAdAccounts } = useAdAccounts({
    enabled: true,
  });
  const { audiences, isLoading: loadingAudiences } = useAudiences({
    enabled: Boolean(fbAdAccountId),
    fbAdAccountId,
  });

  const integrationApp = useIntegrationApp();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  function handleCreate() {
    setPending(true);
    toast.promise(
      async () => {
        if (!fbAdAccountId || !newName) return;

        const res = await integrationApp
          .connection('facebook-ads')
          .action('create-custom-audience')
          .run({
            name: newName,
            description: newDesc,
            fbAdAccountId,
          });
        const newId = res.output.id as string;

        // refresh audiences list
        await queryClient.invalidateQueries({
          queryKey: ['facebook-audiences', fbAdAccountId],
        });

        // select the new audience in the form
        setValue('integration.fbAudienceId', newId, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue('integration.fbAudienceName', newName, {
          shouldDirty: true,
          shouldValidate: true,
        });

        // reset dialog
        setOpen(false);
        setNewName('');
        setNewDesc('');
      },
      {
        loading: 'Creating custom audience...',
        success: () => {
          setPending(false);
          return 'Custom audience created';
        },
        error: () => {
          setPending(false);
          return 'Failed to create custom audience';
        },
      },
    );
  }

  return (
    <>
      <FormField
        control={control}
        name="integration.fbAdAccountId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Ad Account</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                const found = adAccounts?.find((a) => a.id === value);
                setValue('integration.fbAdAccountName', found?.name ?? '', {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              defaultValue={field.value}
              disabled={loadingAdAccounts}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingAdAccounts
                        ? 'Loading ad accounts...'
                        : 'Choose an ad account'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {adAccounts?.map((acct) => (
                  <SelectItem key={acct.id} value={acct.id}>
                    {acct.name}
                  </SelectItem>
                ))}
                {!adAccounts?.length && (
                  <SelectItem value="none" disabled>
                    No ad accounts found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="integration.fbAudienceId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Facebook Audience</FormLabel>
            <FormControl>
              <Select
                key={`${field.value}_${audiences?.length}`}
                onValueChange={(value) => {
                  field.onChange(value);
                  const found = audiences?.find((a) => a.id === value);
                  setValue('integration.fbAudienceName', found?.name ?? '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                value={field.value}
                disabled={!fbAdAccountId || loadingAudiences}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !fbAdAccountId
                        ? 'Select an ad account first'
                        : loadingAudiences
                          ? 'Loading audiences...'
                          : 'Choose an audience'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {audiences?.map((aud) => (
                    <SelectItem key={aud.id} value={aud.id}>
                      {aud.name}
                    </SelectItem>
                  ))}
                  {!audiences?.length && (
                    <SelectItem value="none" disabled>
                      No audiences found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={!fbAdAccountId}>
            + Create new audience
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Audience</DialogTitle>
          </DialogHeader>
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Audience name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>Description (optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="Short description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </FormControl>
          </FormItem>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName || pending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
