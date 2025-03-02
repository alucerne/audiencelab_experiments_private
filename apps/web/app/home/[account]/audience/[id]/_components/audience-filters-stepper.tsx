import { cloneElement } from 'react';

import { useFormContext } from 'react-hook-form';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { AudienceFiltersFormValues } from '~/lib/audience/schema/audience-filters-form.schema';

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
    readonly icon: JSX.Element;
  }[];
  currentStep: number;
  setStep: (step: number) => void;
  pending: boolean;
  isUpdate?: boolean;
}) {
  const form = useFormContext<AudienceFiltersFormValues>();

  return (
    <div className="w-full max-w-64 space-y-2 border-r pr-2">
      {steps.map((step, index) => (
        <div
          key={index}
          className={cn(
            'flex cursor-pointer items-center space-x-4 rounded-md p-2 hover:bg-muted',
            currentStep === index && 'bg-secondary',
          )}
          onClick={() => setStep(index)}
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full bg-secondary p-1.5',
              currentStep === index && 'bg-primary',
            )}
          >
            {cloneElement(step.icon, {
              className: cn(
                'h-3.5 w-3.5 text-muted-foreground',
                currentStep === index && 'text-primary-foreground',
              ),
            })}
          </div>
          <div className="font-medium text-muted-foreground">
            <div
              className={cn('text-sm', currentStep === index && 'text-primary')}
            >
              {step.label}
            </div>
            <div className="text-xs">{step.description}</div>
          </div>
        </div>
      ))}
      <Button
        type="submit"
        disabled={pending || !form.formState.isValid}
        className="w-full"
      >
        {isUpdate ? 'Update' : 'Add'} Filters
      </Button>
    </div>
  );
}
