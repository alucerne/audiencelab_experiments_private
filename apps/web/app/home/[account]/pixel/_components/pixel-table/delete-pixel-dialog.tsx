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

import { Tables } from '~/lib/database.types';
import { deletePixelAction } from '~/lib/pixel/server-actions';

export default function DeletePixelDialog({
  pixel,
  children,
}: {
  pixel: Tables<'pixel'>;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const {
    account: { id },
  } = useTeamAccountWorkspace();

  function handleDelete() {
    startTransition(() => {
      toast.promise(
        deletePixelAction({
          id: pixel.id,
          pixelId: pixel.delivr_id,
          accountId: id,
        }),
        {
          loading: 'Deleting pixel...',
          success: 'Pixel deleted',
          error: 'Failed to delete pixel',
        },
      );
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className={'max-w-md'}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete Pixel for {pixel.website_name}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this pixel? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type={'button'}
            disabled={pending}
            onClick={handleDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
