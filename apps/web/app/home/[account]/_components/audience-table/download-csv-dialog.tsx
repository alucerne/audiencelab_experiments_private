'use client';

import { format, parseISO } from 'date-fns';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Label } from '@kit/ui/label';
import { cn } from '@kit/ui/utils';

import type { AudienceList } from '~/lib/audience/audience.service';

export function DownloadCsvDialog({
  children,
  audience,
}: {
  children: React.ReactNode;
  audience: AudienceList;
}) {
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
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md gap-0 px-0">
        <DialogHeader className="px-6 pb-4">
          <DialogTitle>Download {audience.name} Audience Lists</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6">
          {audience.enqueue_jobs
            .filter(
              (job): job is typeof job & { csv_url: string } => !!job.csv_url,
            )
            .sort((a, b) => {
              return (
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
              );
            })
            .map((job, index) => {
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
                    index === 0 && 'bg-muted border-primary/20',
                  )}
                >
                  <div className="flex flex-col space-y-0.5">
                    <Label className="text-sm font-medium">
                      {formattedDate}
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      {job.current?.toLocaleString() ?? 'Unknown'} records
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
        </div>
        <div className="flex justify-end px-6 pt-4">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
