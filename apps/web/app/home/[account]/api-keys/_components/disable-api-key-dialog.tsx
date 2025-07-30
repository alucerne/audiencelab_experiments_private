import { useTransition } from 'react';

import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@kit/ui/alert-dialog';
import { Button } from '@kit/ui/button';

import { disableApiKeyAction } from '~/lib/api-keys/server-actions';
import { Database } from '~/lib/database.types';

type ApiKey =
  Database['public']['Functions']['list_api_keys']['Returns'][number];

export default function DisableApiKeyDialog({ apiKey }: { apiKey: ApiKey }) {
  const [pending, startTransition] = useTransition();

  function handleDisable() {
    startTransition(() => {
      toast.promise(
        disableApiKeyAction({
          apiKeyId: apiKey.id,
        }),
        {
          loading: 'Disabling API key...',
          success: 'API key disabled',
          error: 'Failed to disable API key',
        },
      );
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive h-fit py-1"
        >
          Disable
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className={'max-w-md'}>
        <AlertDialogHeader>
          <AlertDialogTitle>Disable {apiKey.name} API Key</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to disable this API key? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type={'button'}
            disabled={pending}
            onClick={handleDisable}
          >
            Disable
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
