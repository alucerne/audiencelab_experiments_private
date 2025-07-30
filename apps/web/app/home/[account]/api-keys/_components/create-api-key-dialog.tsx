'use client';

import { useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { useForm, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import CopyButton from '@kit/ui/copy-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Stepper } from '@kit/ui/stepper';
import { cn } from '@kit/ui/utils';

import { createApiKeyAction } from '~/lib/api-keys/server-actions';

export default function CreateApiKeyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className={'mr-2 w-4'} />
          <span>Create</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
        </DialogHeader>

        <CreateApiKeyForm />
      </DialogContent>
    </Dialog>
  );
}

const CreateApiKeyFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(25, 'Name is too long'),
});

function CreateApiKeyForm() {
  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [key, setKey] = useState<string | null>(null);

  const form = useForm<z.infer<typeof CreateApiKeyFormSchema>>({
    resolver: zodResolver(CreateApiKeyFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const steps = [
    {
      component: <Step1 />,
      fields: ['name'],
    },
    {
      component: key ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">API Key:</p>
          <div className="flex items-center space-x-2">
            <input
              className="w-full rounded border px-2 py-1 text-sm"
              readOnly
              value={key}
            />
            <CopyButton value={key} />
          </div>
          <Alert variant={'destructive'} className="mt-8">
            <ExclamationTriangleIcon className={'h-4'} />
            <AlertTitle>
              Copy and store it securely now — it won&apos;t be shown again.
            </AlertTitle>
            <AlertDescription>
              This key grants access to your account&apos;s data via our public
              API.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <p>Generating API key...</p>
      ),
      fields: [],
    },
  ] as const;

  function onSubmit(values: z.infer<typeof CreateApiKeyFormSchema>) {
    startTransition(() => {
      toast.promise(
        createApiKeyAction({
          ...values,
          accountId,
        }),
        {
          loading: 'Creating API key...',
          success: (data) => {
            setKey(data);
            setStep(step + 1);
            return 'API key created';
          },
          error: 'Failed to create API key',
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
        <div className="px-8">
          <Stepper
            variant={'numbers'}
            steps={['Create', 'Key Info']}
            currentStep={step}
          />
        </div>
        <div
          className={cn('space-y-4 py-8', steps.length - 1 === step && 'pb-0')}
        >
          {steps[step]?.component}
        </div>
        <div
          className={cn(
            'flex w-full justify-between',
            step === 0 && 'justify-end',
          )}
        >
          {step > 0 && step < steps.length - 1 && (
            <Button
              type="button"
              onClick={onPrevious}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="mr-2 size-5" />
              Previous
            </Button>
          )}
          {step === steps.length - 2 && (
            <Button type="submit" disabled={pending} size="sm">
              {pending ? 'Creating...' : 'Create'}
            </Button>
          )}
          {step < steps.length - 2 && (
            <Button type="button" onClick={onNext} size="sm">
              Next
              <ChevronRight className="ml-2 size-5" />
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

function Step1() {
  const { control } = useFormContext<z.infer<typeof CreateApiKeyFormSchema>>();

  return (
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
