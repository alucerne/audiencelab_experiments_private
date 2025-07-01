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

import { SignupLinkData } from '~/lib/white-label/white-label.service';
import { disableSignupLinkAction } from '~/lib/white-label/server-actions';

export default function DisableCodeDialog({
  signupLink,
  children,
}: {
  signupLink: SignupLinkData;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  function handleDisable() {
    startTransition(() => {
      toast.promise(
        disableSignupLinkAction({
          id: signupLink.id,
        }),
        {
          loading: 'Disabling signup link...',
          success: 'Signup link disabled',
          error: 'Failed to disable signup link',
        },
      );
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className={'max-w-md'}>
        <AlertDialogHeader>
          <AlertDialogTitle>Disable {signupLink.name}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to disable this signup link? This action
            cannot be undone.
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
