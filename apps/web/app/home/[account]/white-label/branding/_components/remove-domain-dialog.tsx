import { useTransition } from 'react';

import { toast } from 'sonner';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
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

import { removeWhiteLabelDomainAction } from '~/lib/white-label/server-actions';

export default function RemoveDomainDialog({ domain }: { domain: string }) {
  const [pending, startTransition] = useTransition();
  const {
    account: { id },
  } = useTeamAccountWorkspace();

  function handleRemove() {
    startTransition(() => {
      toast.promise(
        removeWhiteLabelDomainAction({
          accountId: id,
          domain,
        }),
        {
          loading: 'Removing domain...',
          success: 'Domain removed',
          error: 'Failed to remove domain',
        },
      );
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={'destructive'} className={'w-full sm:w-auto'}>
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className={'max-w-md'}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Domain</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this domain? Users will no longer be
            able to access your white-labeled site until a new domain is added
            and verified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type={'button'}
            disabled={pending}
            onClick={handleRemove}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
