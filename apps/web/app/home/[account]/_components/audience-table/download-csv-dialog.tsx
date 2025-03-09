'use client';

import { useState } from 'react';

import { format, parseISO } from 'date-fns';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Label } from '@kit/ui/label';
import { cn } from '@kit/ui/utils';

import type { AudienceList } from '~/lib/audience/audience.service';

function formatStatusCase(status: string) {
  if (!status) return '';
  return status
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function DownloadCsvDialog({
  children,
  audience,
}: {
  children: React.ReactNode;
  audience: AudienceList;
}) {
  const [open, setOpen] = useState(false);

  function handleDownload(csvUrl: string, jobId: string) {
    const link = document.createElement('a');
    link.href = csvUrl;
    link.setAttribute(
      'download',
      jobId
        ? `audience_${audience.name}_job_${jobId}.csv`
        : `audience_${audience.name}_export.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Download {audience.name} Audience Lists</DialogTitle>
        </DialogHeader>
        {audience.enqueue_jobs
          .filter(
            (job): job is typeof job & { csv_url: string } => !!job.csv_url,
          )
          .map((job, index) => {
            const isNewest = index === 0;
            const jobDate = parseISO(job.created_at);
            const today = new Date();
            const isToday =
              jobDate.getDate() === today.getDate() &&
              jobDate.getMonth() === today.getMonth() &&
              jobDate.getFullYear() === today.getFullYear();

            const formattedDate = isToday
              ? `Today • ${format(jobDate, 'h:mm a')}`
              : `${format(jobDate, 'MMM d')} • ${format(jobDate, 'h:mm a')}`;

            return (
              <div
                key={job.id}
                className={cn(
                  'flex items-center justify-between rounded-md border p-2.5',
                  isNewest && 'bg-muted',
                )}
              >
                <div className="flex flex-col space-y-0.5">
                  <Label className="text-sm font-medium">{formattedDate}</Label>
                  <p className="text-muted-foreground text-xs">
                    {formatStatusCase(job.status) || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(job.csv_url, job.id)}
                    className="h-8 px-3"
                  >
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
