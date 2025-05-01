'use client';

import {
  ArrowRight,
  BarChart2,
  Check,
  Copy,
  Download,
  Edit,
  Eye,
  Facebook,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Tables } from '@kit/supabase/database';
import { Button } from '@kit/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';

import DeletePixelDialog from './delete-pixel-dialog';

export default function PixelTableActions({
  pixel,
}: {
  pixel: Tables<'pixel'>;
}) {
  return (
    <div className="flex items-center justify-end space-x-2">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <Edit className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit Webhook</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <ArrowRight className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Enter Pixel Dashboard</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <Check className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Check Validation</TooltipContent>
        </Tooltip>

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
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `<script id="audiencelab-pixel" src="${pixel.delivr_install_url}" async></script>`,
                );
                toast.success('Pixel tag copied to clipboard');
              }}
            >
              <Copy className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy Pixel Tag</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <BarChart2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>See Resolutions</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <Download className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download CSV</TooltipContent>
        </Tooltip>

        <Tooltip>
          <DeletePixelDialog pixel={pixel}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Trash2 className="text-destructive size-3.5" />
              </Button>
            </TooltipTrigger>
          </DeletePixelDialog>

          <TooltipContent>Delete Pixel</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <Send className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send Test Webhook</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <Eye className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Pixel Trial</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
