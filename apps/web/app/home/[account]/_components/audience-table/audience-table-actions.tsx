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
import { addAudienceFiltersAction } from '~/lib/audience/server-actions';

import DeleteAudienceDialog from '../delete-audience-dialog';
import DuplicateAudienceDialog from '../duplicate-audience-dialog';
import { DownloadCsvDialog } from './download-csv-dialog';

/**
 * We'll define the shape for an enqueue_job row to do a local "placeholder" update.
 */
type EnqueueJobRow = {
  id: string;
  account_id: string;
  audience_id: string;
  created_at: string;
  csv_url: string | null;
  current: number | null;
  total: number | null;
  updated_at: string;
  status: string;
};

/**
 * Props for AudienceTableActions
 * @param audience The audience row data
 * @param onLocalRefresh Callback to do a local update of the table with a new (placeholder) job
 */
export default function AudienceTableActions({
  audience,
  onLocalRefresh,
}: {
  audience: AudienceList;
  onLocalRefresh?: (job: EnqueueJobRow) => void;
}) {
  const { account } = useParams<{ account: string }>();

  // Condition to enable the refresh button
  let isRefreshEnabled = false;
  if (audience.latest_job) {
    const statusIsCompleted = audience.latest_job.status === 'COMPLETED';
    let olderThanFiveMinutes = false;

    if (audience.latest_job.created_at) {
      const now = new Date();
      const createdTime = new Date(audience.latest_job.created_at);
      const diffMinutes = differenceInMinutes(now, createdTime);
      olderThanFiveMinutes = diffMinutes >= 5;
    }

    isRefreshEnabled = statusIsCompleted || olderThanFiveMinutes;
  }

  const [isPending, startTransition] = useTransition();

  /**
   * Refresh the audience by calling addAudienceFiltersAction
   * We also immediately do a local update (onLocalRefresh) to show the new job count
   */
  async function handleRefresh() {
    if (!audience.filters) {
      toast.error('This audience has no filters defined.');
      return;
    }

    // Immediately add a local "placeholder" job to increment the refresh count.
    if (onLocalRefresh) {
      const now = new Date().toISOString();
      onLocalRefresh({
        id: crypto.randomUUID(),
        account_id: audience.account_id,
        audience_id: audience.id,
        created_at: now,
        updated_at: now,
        csv_url: null,
        current: 0,
        total: 0,
        status: 'PROCESSING',
      });
    }

    startTransition(() => {
      toast.promise(
        addAudienceFiltersAction({
          accountId: audience.account_id,
          audienceId: audience.id,
          filters: audience.filters,
        }),
        {
          loading: 'Refresh job has been queued successfully.',
          success: 'Refresh job has been queued successfully.',
          error: 'Failed to refresh audience job.',
        },
      );
    });
  }

  return (
    <div className="flex items-center justify-end">
      <TooltipProvider delayDuration={300}>
        {/* Export to Facebook (Disabled for now) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <FacebookLogo size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export to Facebook</p>
          </TooltipContent>
        </Tooltip>

        {/* Refresh Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={!isRefreshEnabled || isPending}
            >
              <RefreshCw size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh</p>
          </TooltipContent>
        </Tooltip>

        {/* Update Audience */}
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

        {/* Duplicate Audience */}
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

        {/* Download CSV */}
        <Tooltip>
          <DownloadCsvDialog audience={audience}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
          </DownloadCsvDialog>
          <TooltipContent>Download CSV</TooltipContent>
        </Tooltip>

        {/* Delete Audience */}
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
