'use client';

import { Download, Trash2 } from 'lucide-react';

import { Tables } from '@kit/supabase/database';
import { Button } from '@kit/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';

import DeleteEnrichmentDialog from './delete-enrichment-dialog';

export default function EnrichmentTableActions({
  enrichment,
}: {
  enrichment: Tables<'enrichment'>;
}) {
  function handleDownloadCSV() {
    if (!enrichment.csv_url) return;

    const link = document.createElement('a');
    link.href = enrichment.csv_url;

    const fileName = enrichment.csv_url.split('/').pop() || 'enrichment.csv';
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex items-center justify-end">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!enrichment.csv_url}
              onClick={handleDownloadCSV}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download CSV</TooltipContent>
        </Tooltip>
        <Tooltip>
          <DeleteEnrichmentDialog enrichment={enrichment}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Trash2 className="text-destructive h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
          </DeleteEnrichmentDialog>
          <TooltipContent>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
