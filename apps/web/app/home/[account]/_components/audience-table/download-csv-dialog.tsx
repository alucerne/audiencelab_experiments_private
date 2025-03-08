'use client';

import { useEffect, useState } from 'react';

import { format, parseISO } from 'date-fns';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Label } from '@kit/ui/label';

import type { AudienceList } from '~/lib/audience/audience.service';
import type { Tables } from '~/lib/database.types';

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
  const [jobs, setJobs] = useState<Tables<'enqueue_job'>[]>(
    audience.enqueue_job ?? [],
  );

  const client = useSupabase();

  // Whenever the dialog is opened, fetch the latest job entries so we always have an up-to-date list
  useEffect(() => {
    if (!open) return;

    // Fetch the latest job entries for this audience
    client
      .from('enqueue_job')
      .select('*')
      .eq('audience_id', audience.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch job entries:', error);
          return;
        }
        if (data) {
          setJobs(data);
        }
      });

    // Subscribe to changes in enqueue_job for the same audience so we can update in real time
    const subscription = client
      .channel(`download-csv-job-channel-${audience.account_id}`)
      .on<Tables<'enqueue_job'>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enqueue_job',
          filter: `audience_id=eq.${audience.id}`,
        },
        async (payload) => {
          if (
            payload.eventType === 'INSERT' ||
            payload.eventType === 'UPDATE'
          ) {
            try {
              const { data, error } = await client
                .from('enqueue_job')
                .select('*')
                .eq('audience_id', audience.id)
                .order('created_at', { ascending: false });

              if (error) {
                console.error('Failed to refetch job entries:', error);
              } else if (data) {
                setJobs(data);
              }
            } catch (error) {
              console.error('Error updating job list:', error);
            }
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [open, client, audience.id, audience.account_id]);

  const handleDownload = (csvUrl?: string, jobId?: string) => {
    if (!csvUrl) return;
    const link = document.createElement('a');
    link.href = csvUrl;
    link.setAttribute(
      'download',
      jobId
        ? `audience_${audience.id}_job_${jobId}.csv`
        : `audience_${audience.id}_export.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Download {audience.name} Audience</DialogTitle>
        </DialogHeader>

        {jobs.length === 0 ? (
          <div className="text-muted-foreground py-6 text-sm">
            No job entries found.
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex flex-col space-y-0.5 text-sm">
                  <Label className="font-medium">
                    Refreshed At:{' '}
                    {format(parseISO(job.created_at), 'MMM d, yyyy h:mm a')}
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Status: {formatStatusCase(job.status) || 'Unknown'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!job.csv_url}
                  onClick={() => handleDownload(job.csv_url, job.id)}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
