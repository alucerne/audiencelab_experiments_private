'use client';

import { Link2Off } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';

import { SignupLinkData } from '../../lib/server/services/admin-signup-links.service';
import DisableCodeDialog from './disable-code-dialog';

export default function SignupLinksTableActions({
  signupLink,
}: {
  signupLink: SignupLinkData;
}) {
  return (
    <div className="flex items-center justify-end">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <DisableCodeDialog signupLink={signupLink}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
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
