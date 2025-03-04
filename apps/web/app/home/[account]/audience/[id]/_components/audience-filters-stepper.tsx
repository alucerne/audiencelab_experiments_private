import { cloneElement } from 'react';
import React from 'react';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

export default function AudienceFiltersStepper({
  steps,
  currentStep,
  setStep,
  pending,
  isUpdate,
}: {
  steps: readonly {
    readonly label: string;
    readonly description: string;
    readonly icon: React.ReactElement<{
      className?: string;
    }>;
  }[];
  currentStep: number;
  setStep: (step: number) => void;
  pending: boolean;
  isUpdate?: boolean;
}) {
  return (
    <div className="w-full max-w-64 space-y-2 border-r pr-2">
      {steps.map((step, index) => (
        <div
          key={index}
          className={cn(
            'hover:bg-muted flex cursor-pointer items-center space-x-4 rounded-md p-2',
            currentStep === index && 'bg-secondary',
          )}
          onClick={() => setStep(index)}
        >
          <div
            className={cn(
              'bg-secondary flex items-center justify-center rounded-full p-1.5',
              currentStep === index && 'bg-primary',
            )}
          >
            {cloneElement(step.icon, {
              className: cn(
                'text-muted-foreground h-3.5 w-3.5',
                currentStep === index && 'text-primary-foreground',
              ),
            })}
          </div>
          <div className="text-muted-foreground font-medium">
            <div
              className={cn('text-sm', currentStep === index && 'text-primary')}
            >
              {step.label}
            </div>
            <div className="text-xs">{step.description}</div>
          </div>
        </div>
      ))}
      <Button type="submit" disabled={pending} className="w-full">
        {isUpdate ? 'Refresh' : 'Generate'}
      </Button>
    </div>
  );
}
