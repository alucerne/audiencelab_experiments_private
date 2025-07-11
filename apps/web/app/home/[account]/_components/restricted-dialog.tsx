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
  whiteLabelRestricted,
}: {
  restricted: boolean;
  whiteLabelRestricted: boolean;
}) {
  if (!restricted && !whiteLabelRestricted) {
    return null;
  }

  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          {restricted && (
            <>
              <DialogTitle className="text-destructive">
                Account Restricted
              </DialogTitle>
              <DialogDescription>
                Your account has been restricted. Please contact support via the
                ticket system to reactivate your account.
              </DialogDescription>
            </>
          )}
          {whiteLabelRestricted && (
            <>
              <DialogTitle className="text-destructive">
                The site is experiencing down-time.
              </DialogTitle>
              <DialogDescription>
                Please contact support for more updates.
              </DialogDescription>
            </>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
