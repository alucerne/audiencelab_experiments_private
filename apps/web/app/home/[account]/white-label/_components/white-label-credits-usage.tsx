import React from 'react';

import {
  AlertCircle,
  Ban,
  BookUser,
  CheckCircle,
  CodeXml,
  Filter,
  UserSearch,
  Users,
  Zap,
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Progress } from '@kit/ui/progress';

interface WhiteLabelCreditMetrics {
  enrichment: {
    monthlyMax: number;
    allocated: number;
    currentCount: number;
    sizeLimit: number;
    allocatedSize: number;
  };
  audience: {
    maxLists: number;
    allocated: number;
    currentCount: number;
    sizeLimit: number;
    allocatedSize: number;
  };
  audienceFilters: {
    maxCustomInterests: number;
    allocated: number;
    currentCustom: number;
    b2bAccess: boolean;
    intentAccess: boolean;
  };
  pixel: {
    maxPixels: number;
    allocated: number;
    currentCount: number;
    sizeLimit: number;
    allocatedSize: number;
  };
}

export default function WhiteLabelCreditsUsage({
  enrichment,
  audience,
  audienceFilters,
  pixel,
}: WhiteLabelCreditMetrics) {
  const enrichmentAllocatedPercentage =
    enrichment.monthlyMax > 0
      ? (enrichment.allocated / enrichment.monthlyMax) * 100
      : 0;
  const enrichmentUsagePercentage =
    enrichment.allocated > 0
      ? (enrichment.currentCount / enrichment.allocated) * 100
      : 0;

  const audienceAllocatedPercentage =
    audience.maxLists > 0 ? (audience.allocated / audience.maxLists) * 100 : 0;
  const audienceUsagePercentage =
    audience.allocated > 0
      ? (audience.currentCount / audience.allocated) * 100
      : 0;

  const pixelAllocatedPercentage =
    pixel.maxPixels > 0 ? (pixel.allocated / pixel.maxPixels) * 100 : 0;
  const pixelUsagePercentage =
    pixel.allocated > 0 ? (pixel.currentCount / pixel.allocated) * 100 : 0;

  const customIntentsAllocatedPercentage =
    audienceFilters.maxCustomInterests > 0
      ? (audienceFilters.allocated / audienceFilters.maxCustomInterests) * 100
      : 0;
  const customIntentsUsagePercentage =
    audienceFilters.allocated > 0
      ? (audienceFilters.currentCustom / audienceFilters.allocated) * 100
      : 0;

  return (
    <div className="container m-0 p-0">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <BookUser className="h-5 w-5" />
                  <span>Audience Lists</span>
                </div>
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {audience.currentCount}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="mr-1 h-3 w-3" />
                  {audience.allocated}
                </Badge>
                <Badge variant="default" className="text-xs">
                  {audience.maxLists}
                </Badge>
              </div>
            </div>
            <CardDescription>
              Monthly audience lists usage and allocation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Allocated to Users</span>
                <span>
                  {Math.min(100, audienceAllocatedPercentage).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(100, audienceAllocatedPercentage)}
                className="bg-muted h-2"
              />
              <p className="text-muted-foreground text-xs">
                {audience.allocated} of {audience.maxLists} allocated
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Usage</span>
                <span>
                  {Math.min(100, audienceUsagePercentage).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(100, audienceUsagePercentage)}
                className="bg-muted h-2"
              />
              <p className="text-muted-foreground text-xs">
                {audience.currentCount} of {audience.allocated} used
              </p>
            </div>

            <div className="bg-muted rounded-md p-3">
              <h4 className="mb-1 text-sm font-medium">Account Limit</h4>
              <p className="text-muted-foreground text-xs">
                {audience.sizeLimit.toLocaleString()} contacts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <UserSearch className="h-5 w-5" />
                  <span>Enrichments</span>
                </div>
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {enrichment.currentCount}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="mr-1 h-3 w-3" />
                  {enrichment.allocated}
                </Badge>
                <Badge variant="default" className="text-xs">
                  {enrichment.monthlyMax}
                </Badge>
              </div>
            </div>
            <CardDescription>
              Monthly enrichment uploads usage and allocation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Allocated to Users</span>
                <span>
                  {Math.min(100, enrichmentAllocatedPercentage).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(100, enrichmentAllocatedPercentage)}
                className="bg-muted h-2"
              />
              <p className="text-muted-foreground text-xs">
                {enrichment.allocated} of {enrichment.monthlyMax} allocated
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Usage</span>
                <span>
                  {Math.min(100, enrichmentUsagePercentage).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(100, enrichmentUsagePercentage)}
                className="bg-muted h-2"
              />
              <p className="text-muted-foreground text-xs">
                {enrichment.currentCount} of {enrichment.allocated} used
              </p>
            </div>

            <div className="bg-muted rounded-md p-3">
              <h4 className="mb-1 text-sm font-medium">Account Limit</h4>
              <p className="text-muted-foreground text-xs">
                {enrichment.sizeLimit.toLocaleString()} contacts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <CodeXml className="h-5 w-5" />
                  <span>Pixels</span>
                </div>
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {pixel.currentCount}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="mr-1 h-3 w-3" />
                  {pixel.allocated}
                </Badge>
                <Badge variant="default" className="text-xs">
                  {pixel.maxPixels}
                </Badge>
              </div>
            </div>
            <CardDescription>
              Monthly pixels usage and allocation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Allocated to Users</span>
                  <span>
                    {Math.min(100, pixelAllocatedPercentage).toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(100, pixelAllocatedPercentage)}
                  className="bg-muted h-2"
                />
                <p className="text-muted-foreground text-xs">
                  {pixel.allocated} of {pixel.maxPixels} allocated
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Usage</span>
                  <span>{Math.min(100, pixelUsagePercentage).toFixed(0)}%</span>
                </div>
                <Progress
                  value={Math.min(100, pixelUsagePercentage)}
                  className="bg-muted h-2"
                />
                <p className="text-muted-foreground text-xs">
                  {pixel.currentCount} of {pixel.allocated} used
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-md p-3">
              <h4 className="mb-1 text-sm font-medium">
                Account Resolution Limit
              </h4>
              <p className="text-muted-foreground text-xs">
                {pixel.sizeLimit.toLocaleString()} resolutions per pixel
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <span>Audience Filters & Features</span>
              </div>
            </CardTitle>
            <CardDescription>
              Available features and custom interests allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">Intent Access</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Intent-based targeting
                  </p>
                </div>
                {audienceFilters.intentAccess ? (
                  <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                ) : (
                  <Ban className="ml-2 h-5 w-5 text-red-500" />
                )}
              </div>

              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">B2B Access</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Business targeting filters
                  </p>
                </div>
                {audienceFilters.b2bAccess ? (
                  <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                ) : (
                  <Ban className="ml-2 h-5 w-5 text-red-500" />
                )}
              </div>

              <div className="rounded-md border p-4 md:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Custom Interests</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Allocation and usage of custom interests
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Users className="mr-1 h-3 w-3" />
                      {audienceFilters.currentCustom}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="mr-1 h-3 w-3" />
                      {audienceFilters.allocated}
                    </Badge>
                    <Badge variant="default" className="text-xs">
                      {audienceFilters.maxCustomInterests}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Allocated</span>
                    <span>
                      {Math.min(100, customIntentsAllocatedPercentage).toFixed(
                        0,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, customIntentsAllocatedPercentage)}
                    className="bg-muted h-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span>
                      {Math.min(100, customIntentsUsagePercentage).toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, customIntentsUsagePercentage)}
                    className="bg-muted h-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-muted-foreground mt-8 text-sm">
        <div className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          <p>
            Manage user allocations and monitor usage across your white label
            account. Contact support for limit adjustments or feature upgrades.
          </p>
        </div>
      </div>
    </div>
  );
}
