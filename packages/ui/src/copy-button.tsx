'use client';

import { useState } from 'react';

import { Check, Copy } from 'lucide-react';

import { Button } from './shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './shadcn/tooltip';

export default function CopyButton({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCopy}
            variant="ghost"
            className={label ? 'h-fit gap-2 px-2 py-1' : 'size-7'}
            size={label ? 'sm' : 'icon'}
            type="button"
          >
            {label && <span>{label}</span>}
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
