'use client';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Path, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button } from '@kit/ui/button';
import { Form } from '@kit/ui/form';

import {
  IntegrationKey,
  NewSyncFormSchema,
} from '~/lib/integration-app/schema/new-sync-form.schema';

import { createSyncAction } from '../_lib/server-actions';
import AudienceStep from './audience-step';
import FacebookStep from './facebook-step';
import GoogleSheetsStep from './google-sheets-step';
import IntegrationStep from './integration-step';

interface IntegrationKeyStep {
  component: React.ReactNode;
  fields: Path<z.infer<typeof NewSyncFormSchema>>[];
  title: string;
}

const integrationStepMap: Record<IntegrationKey, IntegrationKeyStep> = {
  'facebook-ads': {
    component: <FacebookStep />,
    fields: ['integration'],
    title: '2. Set Up Facebook Connection',
  },
  'google-sheets': {
    component: <GoogleSheetsStep />,
    fields: ['integration'],
    title: '2. Set Up Google Sheets Connection',
  },
  //! add integration form steps here
  // 'google-ads': {
  //   component: <GoogleStep />,
  //   fields: ['integration'],
  //   title: '2. Set Up Google Connection',
  // },
};

export default function NewSyncForm() {
  const {
    account: { id: accountId, slug },
  } = useTeamAccountWorkspace();
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  const form = useForm<z.infer<typeof NewSyncFormSchema>>({
    resolver: zodResolver(NewSyncFormSchema),
  });

  const integrationKey = form.watch('integration.integrationKey');

  function onSubmit(values: z.infer<typeof NewSyncFormSchema>) {
    startTransition(() => {
      toast.promise(
        createSyncAction({
          accountId,
          ...values,
        }),
        {
          loading: 'Setting up sync...',
          success: () => {
            router.push(`/home/${slug}/sync`);
            return 'Sync created successfully';
          },
          error: 'Failed to create sync',
        },
      );
    });
  }

  async function onNext() {
    const currentStep = getSteps(integrationKey)[step];
    form.clearErrors();
    const isValid = await form.trigger(currentStep?.fields);

    if (isValid) {
      setStep(step + 1);
    }
  }

  function onPrevious() {
    setStep(step - 1);
  }

  function getSteps(integrationKey: IntegrationKey): IntegrationKeyStep[] {
    return [
      {
        component: <IntegrationStep onConnect={onNext} />,
        fields: ['integration.integrationKey'],
        title: '1. Select a Destination',
      },
      integrationStepMap[integrationKey],
      {
        component: <AudienceStep />,
        fields: ['audienceId'],
        title: '3. Select Audience & Schedule Sync',
      },
    ];
  }

  const steps = getSteps(integrationKey);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="border-t py-4 lg:px-4"
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{steps[step]?.title}</h2>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button
                  type="button"
                  onClick={onPrevious}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
              )}
              {step === steps.length - 1 && (
                <Button type="submit" disabled={pending} size="sm">
                  {pending ? 'Creating...' : 'Create'}
                </Button>
              )}
              {step !== 0 && step < steps.length - 1 && (
                <Button
                  type="button"
                  onClick={onNext}
                  size="sm"
                  className="px-4"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-4 py-8">{steps[step]?.component}</div>
        </div>
      </form>
    </Form>
  );
}
