'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';

export default function RestrictedDialog({
  restricted,
}: {
  restricted: boolean;
}) {
  if (!restricted) return null;

  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Account Restricted
          </DialogTitle>
          <DialogDescription>
            Your account has been restricted. Please contact support via the
            ticket system to reactivate your account.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
