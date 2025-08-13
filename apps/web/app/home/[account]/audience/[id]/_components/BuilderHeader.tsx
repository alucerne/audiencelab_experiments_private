'use client';

import React from 'react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@kit/ui/tooltip';
import { FilterMode } from '~/lib/audience/schema/boolean-filters.schema';

interface BuilderHeaderProps {
  mode: FilterMode;
  onModeChange: (mode: FilterMode) => void;
  b2bAccess: boolean;
  audienceName: string;
  onPreview: () => void;
  onGenerate: () => void;
  pending: boolean;
  isValid: boolean;
  isUpdate: boolean;
}

export function BuilderHeader({
  mode,
  onModeChange,
  b2bAccess,
  audienceName,
  onPreview,
  onGenerate,
  pending,
  isValid,
  isUpdate
}: BuilderHeaderProps) {
  const canUseBooleanMode = b2bAccess;

  return (
    <div className="flex flex-col justify-between pb-6 min-[896px]:flex-row lg:pr-4 lg:pb-0">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1.5">
          <h1 className="text-2xl font-semibold">{`${audienceName} Audience Filters`}</h1>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Builder Mode:</span>
            <div className="flex items-center border rounded-md">
              <Button
                variant={mode === 'simple' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onModeChange('simple')}
                className="rounded-r-none"
              >
                Simple
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={mode === 'boolean' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => canUseBooleanMode && onModeChange('boolean')}
                      disabled={!canUseBooleanMode}
                      className="rounded-l-none"
                    >
                      Boolean
                      <Badge variant="secondary" className="ml-2">BETA</Badge>
                    </Button>
                  </TooltipTrigger>
                  {!canUseBooleanMode && (
                    <TooltipContent>
                      <p>Boolean Builder requires B2B access</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {mode === 'boolean' && (
            <Badge variant="outline" className="text-xs">
              Advanced B2B filtering with AND/OR/NOT logic
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex flex-col-reverse items-center gap-4 md:flex-row">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            disabled={pending}
            className="px-3 py-1.5"
            variant="secondary"
            onClick={onPreview}
          >
            Preview
          </Button>
          <Button
            type="button"
            disabled={pending || !isValid}
            className="px-3 py-1.5"
            onClick={onGenerate}
          >
            {isUpdate ? 'Update Audience' : 'Generate Audience'}
          </Button>
        </div>
      </div>
    </div>
  );
} 