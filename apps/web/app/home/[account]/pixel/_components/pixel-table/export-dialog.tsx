'use client';

import { useState, useTransition } from 'react';

import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { cn } from '@kit/ui/utils';

import { Pixel } from '~/lib/pixel/pixel.service';
import { createPixelExportAction } from '~/lib/pixel/server-actions';

const daysBackOptions = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '15', label: '15 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '180 days' },
] as const;

export function PixelExportDialog({
  children,
  pixel,
}: {
  children: React.ReactNode;
  pixel: Pixel;
}) {
  const [isPending, startTransition] = useTransition();
  const [daysBack, setDaysBack] =
    useState<(typeof daysBackOptions)[number]['value']>('30');

  function handleCreateExport() {
    startTransition(() => {
      toast.promise(
        createPixelExportAction({
          pixelId: pixel.id,
          daysBack: daysBack,
        }),
        {
          loading: 'Creating pixel export...',
          success: (data) => {
            handleDownload(data.csv_url);
            return 'Pixel export created!';
          },
          error: 'Failed to create pixel export.',
        },
      );
    });
  }

  function handleDownload(csvUrl: string) {
    const link = document.createElement('a');
    link.href = csvUrl;
    link.setAttribute('download', 'pixel_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md gap-0 px-0">
        <DialogHeader className="px-6 pb-4">
          <DialogTitle>Download {pixel.website_name} Pixel Data</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6">
          {pixel.pixel_export.length > 0 ? (
            pixel.pixel_export
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
                        {job.count?.toLocaleString() ?? 'Unknown'} records
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(job.csv_url)}
                        className="h-8 px-3"
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground text-sm">
                No exports available.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-6 pt-4">
          <div className="flex items-center gap-2">
            <Select
              value={daysBack}
              onValueChange={(val: (typeof daysBackOptions)[number]['value']) =>
                setDaysBack(val)
              }
            >
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {daysBackOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={handleCreateExport}
            >
              {isPending ? 'Creating...' : 'Create Export'}
            </Button>
          </div>
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
