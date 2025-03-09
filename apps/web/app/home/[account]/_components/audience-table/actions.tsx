'use client';

import { useTransition } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { differenceInMinutes } from 'date-fns';
import { Copy, Download, RefreshCw, SquarePen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button, buttonVariants } from '@kit/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';
import { cn } from '@kit/ui/utils';

import FacebookLogo from '~/components/assets/facebook-logo';
import { AudienceList } from '~/lib/audience/audience.service';
import { audienceFiltersFormSchema } from '~/lib/audience/schema/audience-filters-form.schema';
import { addAudienceFiltersAction } from '~/lib/audience/server-actions';

import DeleteAudienceDialog from './delete-audience-dialog';
import { DownloadCsvDialog } from './download-csv-dialog';
import DuplicateAudienceDialog from './duplicate-audience-dialog';

export default function AudienceTableActions({
  audience,
}: {
  audience: AudienceList;
}) {
  const { account } = useParams<{ account: string }>();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      toast.promise(
        () => {
          const filters = audienceFiltersFormSchema.parse(audience.filters);

          return addAudienceFiltersAction({
            accountId: audience.account_id,
            audienceId: audience.id,
            filters,
          });
        },
        {
          loading: 'Queueing audience refresh...',
          success: 'Refresh job has been queued successfully.',
          error: 'Failed to queue audience refresh.',
        },
      );
    });
  }

  return (
    <div className="flex items-center justify-end">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7" disabled>
              <FacebookLogo size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export to Facebook</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleRefresh}
              disabled={
                (audience.latest_job.status !== 'COMPLETED' &&
                  audience.latest_job.created_at &&
                  differenceInMinutes(
                    new Date(),
                    new Date(audience.latest_job.created_at),
                  ) < 5) ||
                isPending
              }
            >
              <RefreshCw size={14} />
            </Button>
          </TooltipTrigger>
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
                  className: 'h-7 w-7 cursor-default',
                }),
              )}
            >
              <SquarePen className="h-3.5 w-3.5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Update</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <DuplicateAudienceDialog audience={audience}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
          </DuplicateAudienceDialog>
          <TooltipContent>
            <p>Duplicate</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <DownloadCsvDialog audience={audience}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={
                  audience.enqueue_jobs.filter(
                    (job) => typeof job.csv_url === 'string',
                  ).length === 0
                }
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
          </DownloadCsvDialog>
          <TooltipContent>Download CSV</TooltipContent>
        </Tooltip>
        <Tooltip>
          <DeleteAudienceDialog audience={audience}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Trash2 className="text-destructive h-3.5 w-3.5" />
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
