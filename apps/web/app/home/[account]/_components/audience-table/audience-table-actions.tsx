import Link from "next/link";
import { useParams } from "next/navigation";

import {
  Copy,
  Download,
  RefreshCw,
  SquarePen,
  Trash2,
  Facebook,
} from "lucide-react";

import { Button, buttonVariants } from "@kit/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kit/ui/tooltip";
import { cn } from "@kit/ui/utils";

import FacebookLogo from "~/components/assets/facebook-logo";
import { AudienceList } from "~/lib/audience/audience.service";

import DeleteAudienceDialog from "../delete-audience-dialog";
import DuplicateAudienceDialog from "../duplicate-audience-dialog";
import { DownloadCsvDialog } from "./download-csv-dialog";

export default function AudienceTableActions({
  audience,
}: {
  audience: AudienceList;
}) {
  const { account } = useParams<{ account: string }>();

  return (
    <div className="flex items-center justify-end">
      <TooltipProvider delayDuration={300}>
        {/* Facebook Export Button Example - Not changed */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={true}
            >
              <FacebookLogo size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export to Facebook</p>
          </TooltipContent>
        </Tooltip>

        {/* Refresh Button Example - Not changed */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <RefreshCw className="h-3.5 w-3.5" />
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
                  variant: "ghost",
                  size: "icon",
                  className: "h-7 w-7",
                })
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
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 cursor-pointer"
              >
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
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
          </DownloadCsvDialog>
          <TooltipContent>Download CSV</TooltipContent>
        </Tooltip>

        <Tooltip>
          <DeleteAudienceDialog audience={audience}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 cursor-pointer"
              >
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
