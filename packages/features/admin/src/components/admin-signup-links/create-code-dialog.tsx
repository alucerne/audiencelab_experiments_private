'use client';

import { useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { useForm, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import { Calendar } from '@kit/ui/calendar';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@kit/ui/popover';
import { Stepper } from '@kit/ui/stepper';
import { Switch } from '@kit/ui/switch';
import { cn } from '@kit/ui/utils';

import { createSignupLinkAction } from '../../lib/server/admin-server-actions';
import { AdminSignupLinkFormSchema } from '../../lib/server/schema/admin-signup-link-form.schema';

export default function CreateCodeDialog({
  disabled,
  signupUrl,
}: {
  disabled?: boolean;
  signupUrl: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="w-fit">
          Create
        </Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Create Signup Link</DialogTitle>
        </DialogHeader>

        <CreateCodeForm signupUrl={signupUrl} />
      </DialogContent>
    </Dialog>
  );
}

function CreateCodeForm({ signupUrl }: { signupUrl: string }) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const form = useForm<z.infer<typeof AdminSignupLinkFormSchema>>({
    resolver: zodResolver(AdminSignupLinkFormSchema),
    defaultValues: {
      signup: {
        name: '',
        code: '',
      },
      permissions: {
        audience_size_limit: 500000,
        b2b_access: false,
        enrichment_size_limit: 500000,
        intent_access: false,
        max_audience_lists: 20,
        max_custom_interests: 1,
        monthly_enrichment_limit: 1,
      },
    },
  });

  const steps = [
    {
      component: <Step1 />,
      fields: ['signup'],
    },
    {
      component: <Step2 />,
      fields: ['permissions'],
    },
    {
      component: generatedCode ? (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">Signup Code:</p>
            <div className="flex items-center space-x-2">
              <input
                className="w-full rounded border px-2 py-1 text-sm"
                readOnly
                value={generatedCode}
              />
              <CopyButton value={generatedCode} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Signup Link:</p>
            <div className="flex items-center space-x-2">
              <input
                className="w-full rounded border px-2 py-1 text-sm"
                readOnly
                value={`${signupUrl}?code=${encodeURIComponent(generatedCode)}`}
              />
              <CopyButton
                value={`${signupUrl}?code=${encodeURIComponent(generatedCode)}`}
              />
            </div>
          </div>
        </>
      ) : (
        <p>Generating signup code...</p>
      ),
      fields: [],
    },
  ] as const;

  function onSubmit(values: z.infer<typeof AdminSignupLinkFormSchema>) {
    startTransition(() => {
      toast.promise(createSignupLinkAction(values), {
        loading: 'Creating signup link...',
        success: (data) => {
          setGeneratedCode(data.code);
          setStep(step + 1);
          return 'Signup link created';
        },
        error: 'Failed to create signup link',
      });
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
          steps={['Signup Details', 'Team Permissions', 'Signup Link']}
          currentStep={step}
        />
        <div className="space-y-4 py-8">{steps[step]?.component}</div>
        <div
          className={cn(
            'flex w-full justify-between',
            step === 0 && 'justify-end',
          )}
        >
          {step > 0 && (
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

function generateRandomCode(length = 10) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
    .toUpperCase();
}

export function Step1() {
  const { control, setValue } =
    useFormContext<z.infer<typeof AdminSignupLinkFormSchema>>();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        control={control}
        name="signup.name"
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
      <FormField
        control={control}
        name="signup.code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Code</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl>
                <Input {...field} placeholder="Code" />
              </FormControl>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setValue('signup.code', generateRandomCode(10), {
                    shouldDirty: true,
                  })
                }
              >
                Generate
              </Button>
            </div>
            <FormDescription>
              This will be the code used to signup
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="signup.max_usage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Usage</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormDescription>Optional</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="signup.expires_at"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Expiration Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      'pl-3 text-left font-normal',
                      !field.value && 'text-muted-foreground',
                    )}
                  >
                    {field.value ? (
                      format(field.value, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormDescription>Optional</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function Step2() {
  const { control } =
    useFormContext<z.infer<typeof AdminSignupLinkFormSchema>>();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <FormField
          control={control}
          name="permissions.audience_size_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audience Size Limit</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                Maximum number of contacts in an audience
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="permissions.enrichment_size_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enrichment Size Limit</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                Maximum records per enrichment batch
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="permissions.max_audience_lists"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Audience Lists</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                Maximum number of audience lists allowed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="permissions.max_custom_interests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Custom Interests</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                Maximum number of custom interests allowed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="permissions.monthly_enrichment_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Enrichment Limit</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                Maximum enrichments allowed per month
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="permissions.b2b_access"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">B2B Access</FormLabel>
                <FormDescription>Enable access to B2B features</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="permissions.intent_access"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Intent Access</FormLabel>
                <FormDescription>
                  Enable access to intent data features
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      onClick={handleCopy}
      variant="ghost"
      className="gap-2"
      size="sm"
      type="button"
    >
      {copied ? (
        <>
          <Check className="size-3.5" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          <span>Copy</span>
        </>
      )}
    </Button>
  );
}
