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

import { Tables } from '~/lib/database.types';
import { deleteEnrichmentAction } from '~/lib/enrichment/server-actions';

export default function DeleteEnrichmentDialog({
  enrichment,
  children,
}: {
  enrichment: Tables<'enrichment'>;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(() => {
      toast.promise(
        deleteEnrichmentAction({
          id: enrichment.id,
        }),
        {
          loading: 'Deleting enrichment...',
          success: 'Enrichment deleted',
          error: 'Failed to delete enrichment',
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
            Delete {enrichment.name} Enrichment
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this enrichment? This action cannot
            be undone.
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
