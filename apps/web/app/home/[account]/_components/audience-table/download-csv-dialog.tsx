"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@kit/ui/dialog";
import { Button } from "@kit/ui/button";
import { Label } from "@kit/ui/label";
import { format, parseISO } from "date-fns";

import type { AudienceList } from "~/lib/audience/audience.service";

export function DownloadCsvDialog({
                                      children,
                                      audience,
                                  }: {
    children: React.ReactNode;
    audience: AudienceList;
}) {
    const [open, setOpen] = useState(false);

    const handleDownload = (csvUrl?: string, jobId?: string) => {
        if (!csvUrl) return;

        const link = document.createElement("a");
        link.href = csvUrl;
        link.setAttribute(
            "download",
            jobId
                ? `audience_${audience.id}_job_${jobId}.csv`
                : `audience_${audience.id}_export.csv`
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
                    <DialogTitle>Select a CSV to Download</DialogTitle>
                </DialogHeader>

                {!audience.enqueue_job?.length ? (
                    <div className="py-6 text-sm text-muted-foreground">
                        No job entries found.
                    </div>
                ) : (
                    <div className="space-y-3 py-2">
                        {audience.enqueue_job.map((job) => {
                            return (
                                <div
                                    key={job.id}
                                    className="flex items-center justify-between rounded-md border p-3"
                                >
                                    <div className="flex flex-col space-y-0.5 text-sm">
                                        <Label className="font-medium">
                                            Created At:{" "}
                                            {format(parseISO(job.created_at), "MMM d, yyyy h:mm a")}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Status: {job.status ?? "unknown"}
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
                            );
                        })}
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
