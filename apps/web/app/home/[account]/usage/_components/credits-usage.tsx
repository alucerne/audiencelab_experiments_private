import React from 'react';

import {
  AlertCircle,
  Ban,
  BookUser,
  CheckCircle,
  Filter,
  UserSearch,
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

import { CreditMetrics } from '~/lib/credits/credits.service';

export default function CreditsUsage({
  enrichment,
  audience,
  audienceFilters,
}: CreditMetrics) {
  const enrichmentPercentage =
    enrichment.monthlyMax > 0
      ? (enrichment.currentCount / enrichment.monthlyMax) * 100
      : 0;
  const audienceListsPercentage =
    audience.maxLists > 0
      ? (audience.currentCount / audience.maxLists) * 100
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
              <Badge
                variant={
                  audienceListsPercentage >= 100 ? 'destructive' : 'outline'
                }
              >
                {audience.currentCount} / {audience.maxLists}
              </Badge>
            </div>
            <CardDescription>
              Monthly audience lists used this calendar month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span>
                  {Math.min(100, audienceListsPercentage).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={Math.min(100, audienceListsPercentage)}
                className="bg-muted"
              />
            </div>

            <div className="bg-muted rounded-md p-3">
              <h4 className="mb-1 font-medium">Audience Size Limit</h4>
              <p className="text-muted-foreground text-sm">
                Maximum {audience.sizeLimit.toLocaleString()} contacts per
                audience
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
              <Badge
                variant={
                  enrichmentPercentage >= 100 ? 'destructive' : 'outline'
                }
              >
                {enrichment.currentCount} / {enrichment.monthlyMax}
              </Badge>
            </div>
            <CardDescription>
              Monthly enrichment uploads used this calendar month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span>{Math.min(100, enrichmentPercentage).toFixed(0)}%</span>
              </div>
              <Progress
                value={Math.min(100, enrichmentPercentage)}
                className="bg-muted"
              />
            </div>

            <div className="bg-muted rounded-md p-3">
              <h4 className="mb-1 font-medium">Enrichment Size Limit</h4>
              <p className="text-muted-foreground text-sm">
                Maximum {enrichment.sizeLimit.toLocaleString()} contacts per
                enrichment
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
              Available features and filters for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">Custom Audiences</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Your unique leads
                  </p>
                </div>
                <Badge
                  variant={
                    audienceFilters.currentCustom >=
                    audienceFilters.maxCustomInterests
                      ? 'destructive'
                      : 'outline'
                  }
                  className="ml-2 whitespace-nowrap"
                >
                  {audienceFilters.currentCustom} /{' '}
                  {audienceFilters.maxCustomInterests}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-muted-foreground mt-8 text-sm">
        <div className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          <p>
            Need more credits or features? Contact support to upgrade your plan.
          </p>
        </div>
      </div>
    </div>
  );
}
