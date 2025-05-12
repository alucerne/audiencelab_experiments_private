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

import { AudienceSyncList } from '~/lib/integration-app/audience-sync.service';
import { deleteSyncAction } from '~/lib/integration-app/server-actions';

export default function DeleteSyncDialog({
  sync,
  children,
}: {
  sync: AudienceSyncList[number];
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(() => {
      toast.promise(
        deleteSyncAction({
          id: sync.id,
        }),
        {
          loading: 'Deleting sync...',
          success: 'Sync deleted',
          error: 'Failed to delete sync',
        },
      );
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className={'max-w-md'}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {sync.audience.name} Sync</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this synchronization?
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
