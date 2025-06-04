'use client';

import { TransitionStartFunction, useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Stepper } from '@kit/ui/stepper';
import { cn } from '@kit/ui/utils';

import { createPixelFormSchema } from '~/lib/pixel/schema/create-pixel-form.schema';
import { createPixelAction } from '~/lib/pixel/server-actions';

import { testWebhookUrlAction } from '../_lib/actions';
import { PixelInstallDialogContent } from './pixel-table/pixel-install-dialog';

export default function CreatePixelDialog2() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-fit">Create</Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>Create Pixel</DialogTitle>
        </DialogHeader>

        <PixelStepForm />
      </DialogContent>
    </Dialog>
  );
}

function PixelStepForm() {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [scriptUrl, setScriptUrl] = useState<string | null>(null);

  const {
    account: { id },
  } = useTeamAccountWorkspace();

  const form = useForm<z.infer<typeof createPixelFormSchema>>({
    defaultValues: {
      websiteName: '',
      websiteUrl: '',
      webhookUrl: '',
    },
    resolver: zodResolver(createPixelFormSchema),
  });

  const steps = [
    {
      component: <PixelStep />,
      fields: ['websiteName', 'websiteUrl'],
    },
    {
      component: (
        <WebhookStep pending={pending} startTransition={startTransition} />
      ),
      fields: ['webhookUrl'],
    },
    {
      component: scriptUrl ? (
        <>
          <p className="text-muted-foreground text-sm">
            Choose your installation method below.
          </p>
          <PixelInstallDialogContent installUrl={scriptUrl} note={false} />
        </>
      ) : (
        <p>Generating pixel...</p>
      ),
      fields: [],
    },
  ] as const;

  function onSubmit(values: z.infer<typeof createPixelFormSchema>) {
    startTransition(() => {
      toast.promise(
        createPixelAction({
          accountId: id,
          pixelData: values,
        }),
        {
          loading: 'Creating pixel...',
          success: (data) => {
            setScriptUrl(data.delivr_install_url);
            setStep(step + 1);
            return 'Pixel successfully created!';
          },
          error: 'Failed to create pixel',
        },
      );
    });
  }

  async function onNext() {
    const isValid = await form.trigger(steps[step]?.fields);
    if (isValid) {
      setStep(step + 1);
    }
  }

  function onPrevious() {
    setStep(step - 1);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stepper
          variant={'numbers'}
          steps={['Pixel Details', 'Webhook', 'Install']}
          currentStep={step}
        />
        <div className="space-y-4 py-8">{steps[step]?.component}</div>
        <div
          className={cn(
            'flex w-full justify-between',
            step === 0 && 'justify-end',
          )}
        >
          {step > 0 && step < 2 && (
            <Button
              type="button"
              onClick={onPrevious}
              variant="outline"
              size="sm"
              disabled={pending}
            >
              <ChevronLeft className="mr-2 size-5" />
              Previous
            </Button>
          )}
          {step === steps.length - 2 && (
            <Button type="submit" disabled={pending} size="sm">
              Create
            </Button>
          )}
          {step < steps.length - 2 && (
            <Button type="button" onClick={onNext} size="sm">
              Next
              <ChevronRight className="ml-2 size-5" />
            </Button>
          )}
          {step === steps.length - 1 && (
            <DialogClose asChild>
              <Button type="button" size="sm" className="ml-auto">
                Finish
              </Button>
            </DialogClose>
          )}
        </div>
      </form>
    </Form>
  );
}

function PixelStep() {
  const { control } = useFormContext<z.infer<typeof createPixelFormSchema>>();

  return (
    <>
      <FormField
        control={control}
        name="websiteName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Website Name</FormLabel>
            <FormControl>
              <Input
                minLength={2}
                maxLength={50}
                placeholder="My Website Pixel"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="websiteUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Website URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function WebhookStep({
  pending,
  startTransition,
}: {
  pending: boolean;
  startTransition: TransitionStartFunction;
}) {
  const { control, getValues, trigger } =
    useFormContext<z.infer<typeof createPixelFormSchema>>();

  async function handleTest() {
    const url = getValues('webhookUrl');
    if (!url || url.trim() === '') {
      toast.error('Please provide a webhook URL to test.');
      return;
    }

    const valid = await trigger('webhookUrl');
    if (!valid) {
      return;
    }

    startTransition(() => {
      toast.promise(testWebhookUrlAction({ webhookUrl: url }), {
        loading: 'Testing webhook URL…',
        success: 'Webhook URL is valid',
        error: 'Failed to reach webhook URL',
      });
    });
  }

  return (
    <FormField
      control={control}
      name="webhookUrl"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Webhook URL</FormLabel>
          <FormControl>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/webhook"
                {...field}
                className="w-full"
              />
              <Button type="button" onClick={handleTest} disabled={pending}>
                Test
              </Button>
            </div>
          </FormControl>
          <FormDescription>
            Optional. This URL will receive pixel events (you can add one
            later).
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
