'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  Boxes,
  Copy,
  Download,
  RefreshCw,
  SquarePen,
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

import { AudienceList } from '~/lib/audience/audience.service';

import AudienceWebhookDialog from './audience-webhook-dialog';
import DeleteAudienceDialog from './delete-audience-dialog';
import { DownloadCsvDialog } from './download-csv-dialog';
import DuplicateAudienceDialog from './duplicate-audience-dialog';
import ScheduleRefreshDialog from './schedule-refresh-dialog';

export default function AudienceTableActions({
  audience,
}: {
  audience: AudienceList;
}) {
  const { account } = useParams<{ account: string }>();

  return (
    <div className="flex items-center justify-end">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <ScheduleRefreshDialog audience={audience}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <RefreshCw size={14} />
              </Button>
            </TooltipTrigger>
          </ScheduleRefreshDialog>
          <TooltipContent>
            <p>Refresh</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/home/${account}/audience/${audience.id}`}
              className={cn(
                buttonVariants({
                  variant: 'ghost',
                  size: 'icon',
                  className: 'size-7 cursor-default',
                }),
              )}
            >
              <SquarePen className="size-3.5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Update</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <DownloadCsvDialog audience={audience}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={
                  audience.enqueue_jobs.filter(
                    (job) => typeof job.csv_url === 'string',
                  ).length === 0
                }
              >
                <Download className="size-3.5" />
              </Button>
            </TooltipTrigger>
          </DownloadCsvDialog>
          <TooltipContent>Download CSV</TooltipContent>
        </Tooltip>
        <Tooltip>
          <AudienceWebhookDialog audience={audience}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <Boxes className="size-3.5" />
              </Button>
            </TooltipTrigger>
          </AudienceWebhookDialog>
          <TooltipContent>
            <p>Webhook</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <DuplicateAudienceDialog audience={audience}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <Copy className="size-3.5" />
              </Button>
            </TooltipTrigger>
          </DuplicateAudienceDialog>
          <TooltipContent>
            <p>Duplicate</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <DeleteAudienceDialog audience={audience}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <Trash2 className="text-destructive size-3.5" />
              </Button>
            </TooltipTrigger>
          </DeleteAudienceDialog>
          <TooltipContent>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
