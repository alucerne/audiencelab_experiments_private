'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  BarChart2,
  Boxes,
  Copy,
  Download,
  Facebook,
  Trash2,
} from 'lucide-react';

import { Button, buttonVariants } from '@kit/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';
import { cn } from '@kit/ui/utils';

import { Pixel } from '~/lib/pixel/pixel.service';

import DeletePixelDialog from './delete-pixel-dialog';
import { PixelExportDialog } from './export-dialog';
import PixelInstallDialog from './pixel-install-dialog';
import PixelWebhookDialog from './pixel-webhook-dialog';

export default function PixelTableActions({ pixel }: { pixel: Pixel }) {
  const { account } = useParams<{ account: string }>();

  return (
    <div className="flex items-center justify-end space-x-2">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <Facebook className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sync with Facebook</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/home/${account}/pixel/${pixel.id}`}
              className={cn(
                buttonVariants({
                  variant: 'ghost',
                  size: 'icon',
                  className: 'size-7 cursor-default',
                }),
              )}
            >
              <BarChart2 className="size-3.5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>See Resolutions</TooltipContent>
        </Tooltip>
        <Tooltip>
          <PixelInstallDialog installUrl={pixel.delivr_install_url}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Copy className="size-3.5" />
              </Button>
            </TooltipTrigger>
          </PixelInstallDialog>
          <TooltipContent>Install</TooltipContent>
        </Tooltip>
        <Tooltip>
          <PixelExportDialog pixel={pixel}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <Download className="size-3.5" />
              </Button>
            </TooltipTrigger>
          </PixelExportDialog>
          <TooltipContent>Export Data</TooltipContent>
        </Tooltip>
        <Tooltip>
          <PixelWebhookDialog pixel={pixel}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Boxes className="size-3.5" />
              </Button>
            </TooltipTrigger>
          </PixelWebhookDialog>
          <TooltipContent>Webhook</TooltipContent>
        </Tooltip>
        <Tooltip>
          <DeletePixelDialog pixel={pixel}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Trash2 className="text-destructive size-3.5" />
              </Button>
            </TooltipTrigger>
          </DeletePixelDialog>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
