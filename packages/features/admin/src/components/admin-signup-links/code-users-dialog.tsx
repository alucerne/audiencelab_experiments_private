'use client';

import Link from 'next/link';

import { format, parseISO } from 'date-fns';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';

import { SignupLinkData } from '../../lib/server/services/admin-signup-links.service';

export function CodeUsersDialog({
  children,
  signupLink,
}: {
  children: React.ReactNode;
  signupLink: SignupLinkData;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md px-0">
        <DialogHeader className="px-6 pb-4">
          <DialogTitle>
            Users that signed up using {signupLink.name}.
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto px-6 py-2">
          {signupLink.signup_code_usages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users yet.</p>
          ) : (
            signupLink.signup_code_usages.map((usage) => {
              const date = parseISO(usage.created_at);
              const formattedDate = format(date, 'PPPp');

              return (
                <Link
                  key={usage.id}
                  href={`/admin/users/${usage.account.id}`}
                  className="bg-card hover:bg-accent flex items-center justify-between gap-4 rounded-lg border p-4 transition"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold leading-none">
                      {usage.account.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {usage.account.email ?? 'No email'}
                    </p>
                  </div>
                  <div className="text-muted-foreground whitespace-nowrap text-sm">
                    {formattedDate}
                  </div>
                </Link>
              );
            })
          )}
        </div>
        <div className="flex justify-end px-6 pt-4">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
