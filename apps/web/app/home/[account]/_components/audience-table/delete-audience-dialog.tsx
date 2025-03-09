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

import { deleteAudienceAction } from '~/lib/audience/server-actions';
import { Tables } from '~/lib/database.types';

export default function DeleteAudienceDialog({
  audience,
  children,
}: {
  audience: Tables<'audience'>;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(() => {
      toast.promise(
        deleteAudienceAction({
          id: audience.id,
        }),
        {
          loading: 'Deleting audience...',
          success: 'Audience deleted',
          error: 'Failed to delete audience',
        },
      );
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className={'max-w-md'}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {audience.name} Audience</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this audience? This action cannot be
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
