'use client';

import { useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, CopyIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { cn } from '@kit/ui/utils';

import { createPixelFormSchema } from '~/lib/pixel/schema/create-pixel-form.schema';
import { createPixelAction } from '~/lib/pixel/server-actions';

const steps = [
  { id: 1, label: 'Pixel', disabledAfterCompletion: true },
  { id: 2, label: 'Install', disabledAfterCompletion: false },
  { id: 3, label: 'Validation', disabledAfterCompletion: false },
  { id: 4, label: 'Results', disabledAfterCompletion: false },
  { id: 5, label: 'Webhook', disabledAfterCompletion: false },
];

export default function CreatePixelDialog() {
  const [current, setCurrent] = useState<number>(1);
  const [scriptUrl, setScriptUrl] = useState('');

  return (
    <Dialog
      onOpenChange={() => {
        setCurrent(1);
        setScriptUrl('');
      }}
    >
      <DialogTrigger asChild>
        <Button>Create</Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="flex h-[70vh] max-w-3xl gap-0 overflow-hidden p-0"
      >
        <aside className="bg-sidebar flex h-full w-52 flex-col border-r p-6">
          <h2 className="mb-4 text-lg font-semibold">Pixel Setup</h2>
          <nav className="space-y-2">
            {steps.map((step) => {
              const isActive = step.id === current;
              const isCompleted = step.id < current;
              const isPending = step.id > current;
              const shouldDisable =
                isPending || (isCompleted && step.disabledAfterCompletion);

              return (
                <button
                  key={step.id}
                  onClick={() => !shouldDisable && setCurrent(step.id)}
                  disabled={shouldDisable}
                  className={cn(
                    'relative flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-all',
                    isActive &&
                      'bg-primary text-primary-foreground font-medium',
                    isCompleted &&
                      !step.disabledAfterCompletion &&
                      'text-foreground font-medium',
                    isPending && 'text-muted-foreground',
                    !isPending &&
                      !isActive &&
                      !shouldDisable &&
                      'hover:bg-muted',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border text-xs',
                      isActive &&
                        'border-primary-foreground bg-primary-foreground text-primary',
                      isCompleted && 'border-green-500 bg-green-500 text-white',
                      isPending && 'border-muted-foreground',
                    )}
                  >
                    {isCompleted ? <Check className="size-3.5" /> : step.id}
                  </div>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="flex flex-1 flex-col gap-6 overflow-auto p-8">
          {current === 1 && (
            <PixelStepForm
              onSuccess={(returnedScript) => {
                setScriptUrl(returnedScript);
                setCurrent(2);
              }}
            />
          )}
          {current === 2 && (
            <InstallStep
              scriptUrl={scriptUrl}
              onProceed={() => setCurrent(3)}
            />
          )}
          {current === 3 && (
            <div>
              <p>
                Step 3: WIP, this is were we will validate pixel is set up
                properly. This is pending how we will manage data.
              </p>
              <Button size="sm" onClick={() => setCurrent(4)} className="mt-4">
                Next
              </Button>
            </div>
          )}
          {current === 4 && (
            <div>
              <p>
                Step 4: WIP, this is were we show results of pixel validation.
                This is pending how we will manage data.
              </p>
              <Button size="sm" onClick={() => setCurrent(5)} className="mt-4">
                Next
              </Button>
            </div>
          )}
          {current === 5 && (
            <div>
              <p>
                Step 5: WIP, this is were we validate the webhook used for
                pixel. This is pending how we will manage pixel data.
              </p>
              <DialogClose asChild>
                <Button size="sm" className="mt-4">
                  Close
                </Button>
              </DialogClose>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PixelStepForm({
  onSuccess,
}: {
  onSuccess: (delivrInstallUrl: string) => void;
}) {
  const [pending, startTransition] = useTransition();
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

  function onSubmit(values: z.infer<typeof createPixelFormSchema>) {
    startTransition(() => {
      toast.promise(
        createPixelAction({
          accountId: id,
          pixelData: values,
        }),
        {
          loading: 'Creating pixel...',
          success: ({ delivr_install_url }) => {
            startTransition(() => onSuccess(delivr_install_url));

            return 'Pixel successfully created!';
          },
          error: 'Failed to create pixel',
        },
      );
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Set Up Your Pixel</DialogTitle>
        <DialogDescription>
          Configure your tracking pixel to start collecting data from your
          website
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
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
          <FormField
            name="webhookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook URL (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://api.example.com/webhook"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Webhook will receive real-time data when visitors are
                  identified
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              Next
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

function InstallStep({
  scriptUrl,
  onProceed,
}: {
  scriptUrl: string;
  onProceed: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(scriptUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Install Your Pixel Code</DialogTitle>
        <DialogDescription asChild className="text-base">
          <ul className="list-decimal space-y-1 pt-3 pl-5">
            <li>
              Insert this script into the{' '}
              <code className="bg-muted rounded px-1">&lt;head&gt;</code> block
              before{' '}
              <code className="bg-muted rounded px-1">&lt;/head&gt;</code> on
              all pages.
            </li>
            <li>
              Save changes and test using browser developer tools (Network tab).
            </li>
          </ul>
        </DialogDescription>
      </DialogHeader>
      <div className="bg-muted relative overflow-auto rounded-md border p-4">
        <pre className="font-mono text-sm break-words whitespace-pre-wrap">
          {`<script id="audiencelab-pixel" src="${scriptUrl}" async></script>`}
        </pre>
        <Button
          variant="outline"
          onClick={handleCopy}
          className="absolute top-2 right-2 h-fit gap-2 px-2.5 py-1 text-xs"
        >
          {copied ? (
            <>
              <Check className="size-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <div className="flex justify-end">
        <Button onClick={onProceed}>Next</Button>
      </div>
    </>
  );
}
