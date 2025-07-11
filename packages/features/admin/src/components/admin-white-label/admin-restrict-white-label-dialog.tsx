'use client';

import { useTransition } from 'react';

import { Lock, LockOpen } from 'lucide-react';
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

import { restrictWhiteLabelAction } from '../../lib/server/admin-server-actions';

export default function AdminRestrictWhiteLabelDialog({
  accountId,
  currentlyRestricted,
}: {
  accountId: string;
  currentlyRestricted: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggleRestriction() {
    startTransition(async () => {
      toast.promise(
        restrictWhiteLabelAction({
          accountId,
          currentlyRestricted,
        }),
        {
          loading: currentlyRestricted
            ? 'Unrestricting white-label...'
            : 'Restricting white-label...',
          success: currentlyRestricted
            ? 'White-label unrestricted.'
            : 'White-label restricted.',
          error: 'Failed to update white-label restriction status.',
        },
      );
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size={'sm'}
          variant={'outline'}
          className="border-destructive text-destructive hover:text-destructive hover:bg-destructive/5"
        >
          {currentlyRestricted ? (
            <>
              <LockOpen className={'mr-1 h-4'} />
              Unrestrict White-label
            </>
          ) : (
            <>
              <Lock className={'mr-1 h-4'} />
              Restrict White-label
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {currentlyRestricted
              ? 'Unrestrict White-label'
              : 'Restrict White-label'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {currentlyRestricted
              ? "This will restore full access to the white-label's subaccounts."
              : 'Are you sure you want to restrict this white-label account? All subaccounts will lose access to all site features.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={pending}
            onClick={handleToggleRestriction}
          >
            {currentlyRestricted ? 'Unrestrict' : 'Restrict'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
