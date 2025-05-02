'use client';

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

import { restrictAccountAction } from '../lib/server/admin-server-actions';

export default function AdminRestrictAccountDialog({
  accountId,
  currentlyRestricted,
  children,
}: {
  accountId: string;
  currentlyRestricted: boolean;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggleRestriction() {
    startTransition(async () => {
      toast.promise(
        restrictAccountAction({
          accountId,
          currentlyRestricted,
        }),
        {
          loading: currentlyRestricted
            ? 'Unrestricting account...'
            : 'Restricting account...',
          success: currentlyRestricted
            ? 'Account unrestricted.'
            : 'Account restricted.',
          error: 'Failed to update account restriction status.',
        },
      );
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {currentlyRestricted ? 'Unrestrict Account' : 'Restrict Account'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {currentlyRestricted
              ? 'This will restore full access to the account.'
              : 'Are you sure you want to restrict this account? All site features will be disabled.'}
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
