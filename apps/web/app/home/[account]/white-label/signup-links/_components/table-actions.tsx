'use client';

import { Link2Off, SquarePen } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';

import { SignupLinkData } from '~/lib/white-label/white-label.service';

import DisableCodeDialog from './disable-code-dialog';
import UpdateCreditsDialog from './update-credits-dialog';

export default function SignupLinksTableActions({
  signupLink,
}: {
  signupLink: SignupLinkData;
}) {
  return (
    <div className="flex items-center justify-end">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <UpdateCreditsDialog signupLink={signupLink}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={!signupLink.enabled}
              >
                <SquarePen size={14} />
              </Button>
            </TooltipTrigger>
          </UpdateCreditsDialog>
          <TooltipContent>
            <p>Update Permissions</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <DisableCodeDialog signupLink={signupLink}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={!signupLink.enabled}
              >
                <Link2Off size={14} />
              </Button>
            </TooltipTrigger>
          </DisableCodeDialog>
          <TooltipContent>
            <p>Disable</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
