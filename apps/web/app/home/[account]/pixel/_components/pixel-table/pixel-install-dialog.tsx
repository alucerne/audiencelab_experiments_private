import { useState } from 'react';

import { Check, CopyIcon } from 'lucide-react';

import { Tables } from '@kit/supabase/database';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';

export default function PixelInstallDialog({
  pixel,
  children,
}: {
  pixel: Tables<'pixel'>;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(
      `<script src="${pixel.delivr_install_url}" async></script>`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Install Pixel</DialogTitle>
          <DialogDescription>
            <ul className="list-decimal space-y-1 pt-3 pl-5">
              <li>
                Insert this script into the{' '}
                <code className="bg-muted rounded px-1">&lt;head&gt;</code>{' '}
                block before{' '}
                <code className="bg-muted rounded px-1">&lt;/head&gt;</code> on
                all pages.
              </li>
              <li>
                Save changes and test using browser developer tools (Network
                tab).
              </li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted relative overflow-auto rounded-md border p-4">
          <pre className="font-mono text-sm break-words whitespace-pre-wrap">
            {`<script src="${pixel.delivr_install_url}" async></script>`}
          </pre>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="absolute top-2 right-2 h-fit gap-2 px-2.5 py-1 text-xs"
          >
            {copied ? (
              <>
                <Check className="size-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-3" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Finish
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
