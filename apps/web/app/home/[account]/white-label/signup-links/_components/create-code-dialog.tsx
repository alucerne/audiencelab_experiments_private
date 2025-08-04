'use client';

import { useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button } from '@kit/ui/button';
import { Calendar } from '@kit/ui/calendar';
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

import { SignupLinkFormSchema } from '~/lib/white-label/schema/signup-link-form.schema';
import { createWhiteLabelSignupLinkAction } from '~/lib/white-label/server-actions';

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
  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  
  // State for resell prices - moved to parent component
  const [resellPrices, setResellPrices] = useState({
    audience: 0,
    custom_model: 0,
    enrichment: 0,
    pixel: 0,
  });

  const form = useForm<z.infer<typeof SignupLinkFormSchema>>({
    resolver: zodResolver(SignupLinkFormSchema),
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
        monthly_audience_limit: 20,
        max_custom_interests: 1,
        monthly_enrichment_limit: 1,
        pixel_size_limit: 1000000,
        monthly_pixel_limit: 3,
      },
    },
  });

  const steps = [
    {
      component: <Step1 />,
      fields: ['signup'],
    },
    {
      component: <Step2 resellPrices={resellPrices} setResellPrices={setResellPrices} />,
      fields: ['permissions'],
    },
    {
      component: generatedCode ? (
        <>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">Magic Signup Link (Recommended)</h3>
              <p className="text-sm text-blue-700 mb-3">
                This link includes embedded payment processing. Clients can sign up and pay in one seamless flow.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Magic Signup Link:</p>
                <div className="flex items-center space-x-2">
                  <input
                    className="w-full rounded border px-2 py-1 text-sm"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/signup-magic?agency_id=${accountId}&amount_cents=${Math.round(
                      ((form.getValues('permissions')?.monthly_audience_limit || 0) * resellPrices.audience +
                       (form.getValues('permissions')?.max_custom_interests || 0) * resellPrices.custom_model +
                       (form.getValues('permissions')?.monthly_enrichment_limit || 0) * resellPrices.enrichment +
                       (form.getValues('permissions')?.monthly_pixel_limit || 0) * resellPrices.pixel) * 100
                    )}&plan_id=${generatedCode}`}
                  />
                  <CopyButton
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/signup-magic?agency_id=${accountId}&amount_cents=${Math.round(
                      ((form.getValues('permissions')?.monthly_audience_limit || 0) * resellPrices.audience +
                       (form.getValues('permissions')?.max_custom_interests || 0) * resellPrices.custom_model +
                       (form.getValues('permissions')?.monthly_enrichment_limit || 0) * resellPrices.enrichment +
                       (form.getValues('permissions')?.monthly_pixel_limit || 0) * resellPrices.pixel) * 100
                    )}&plan_id=${generatedCode}`}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-2">Standard Signup Link</h3>
              <p className="text-sm text-gray-600 mb-3">
                Traditional signup link without payment processing.
              </p>
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
            </div>
          </div>
        </>
      ) : (
        <p>Generating signup code...</p>
      ),
      fields: [],
    },
  ] as const;

  function onSubmit(values: z.infer<typeof SignupLinkFormSchema>) {
    startTransition(() => {
      // Get assigned credits from form values
      const assignedCredits = values.permissions;
      
      // Calculate total amount from resell prices
      const totalAmountCents = Math.round(
        ((assignedCredits?.monthly_audience_limit || 0) * resellPrices.audience +
         (assignedCredits?.max_custom_interests || 0) * resellPrices.custom_model +
         (assignedCredits?.monthly_enrichment_limit || 0) * resellPrices.enrichment +
         (assignedCredits?.monthly_pixel_limit || 0) * resellPrices.pixel) * 100
      );

      toast.promise(
        createWhiteLabelSignupLinkAction({
          ...values,
          accountId,
          resellPrices,
          totalAmountCents,
        }),
        {
          loading: 'Creating signup link...',
          success: (data) => {
            setGeneratedCode(data.code);
            setStep(step + 1);
            return 'Signup link created';
          },
          error: 'Failed to create signup link',
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

function generateRandomCode(length = 10) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
    .toUpperCase();
}

function Step1() {
  const { control, setValue } =
    useFormContext<z.infer<typeof SignupLinkFormSchema>>();

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

function Step2({ 
  resellPrices, 
  setResellPrices 
}: { 
  resellPrices: { audience: number; custom_model: number; enrichment: number; pixel: number };
  setResellPrices: (prices: { audience: number; custom_model: number; enrichment: number; pixel: number }) => void;
}) {
  const { control, watch } = useFormContext<z.infer<typeof SignupLinkFormSchema>>();
  
  // Watch the assigned credits to calculate totals
  const assignedCredits = watch('permissions');

  // Calculate totals
  const calculateTotals = () => {
    const audienceTotal = (assignedCredits?.monthly_audience_limit || 0) * resellPrices.audience;
    const customModelTotal = (assignedCredits?.max_custom_interests || 0) * resellPrices.custom_model;
    const enrichmentTotal = (assignedCredits?.monthly_enrichment_limit || 0) * resellPrices.enrichment;
    const pixelTotal = (assignedCredits?.monthly_pixel_limit || 0) * resellPrices.pixel;
    
    return {
      audienceTotal,
      customModelTotal,
      enrichmentTotal,
      pixelTotal,
      estimatedMonthlyBill: audienceTotal + customModelTotal + enrichmentTotal + pixelTotal,
    };
  };

  const totals = calculateTotals();

  return (
    <>
      <div className="text-muted-foreground mb-4 text-sm">
        When allocating permissions, ensure they do not exceed your
        white-label&apos;s total credits.
      </div>
      
      {/* Existing credit allocation form */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <FormField
          control={control}
          name="permissions.monthly_audience_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Audience Limit</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                Maximum audience lists allowed per month
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
        <FormField
          control={control}
          name="permissions.monthly_pixel_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Pixel Limit</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                Maximum pixels allowed per month
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="permissions.pixel_size_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pixel Resolution Limit</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>Maximum resolutions per pixel</FormDescription>
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
                Maximum custom interests allowed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Access Toggles Section */}
      <div className="mt-6">
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
      </div>

      {/* Resell Credits Section */}
      <div className="mt-8">
        <div className="bg-card text-card-foreground rounded-xl border">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="leading-none font-semibold tracking-tight">Resell Credits</h3>
          </div>
          <div className="p-6 pt-0 space-y-6">
            {/* Pricing Form */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Audience Credit Price ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={resellPrices.audience}
                  onChange={(e) => setResellPrices(prev => ({
                    ...prev,
                    audience: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Model Credit Price ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={resellPrices.custom_model}
                  onChange={(e) => setResellPrices(prev => ({
                    ...prev,
                    custom_model: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Enrichment Credit Price ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={resellPrices.enrichment}
                  onChange={(e) => setResellPrices(prev => ({
                    ...prev,
                    enrichment: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Pixel Credit Price ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={resellPrices.pixel}
                  onChange={(e) => setResellPrices(prev => ({
                    ...prev,
                    pixel: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Preview Box */}
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Monthly Bill Preview</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monthly Credits Assigned:</span>
                  <span className="font-medium">
                    Audience: {assignedCredits?.monthly_audience_limit || 0} | 
                    Custom Model: {assignedCredits?.max_custom_interests || 0} | 
                    Enrichment: {assignedCredits?.monthly_enrichment_limit || 0} | 
                    Pixel: {assignedCredits?.monthly_pixel_limit || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Audience Credit Total:</span>
                  <span className="font-medium">
                    {(assignedCredits?.monthly_audience_limit || 0)} × ${resellPrices.audience.toFixed(2)} = ${totals.audienceTotal.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Custom Model Credit Total:</span>
                  <span className="font-medium">
                    {(assignedCredits?.max_custom_interests || 0)} × ${resellPrices.custom_model.toFixed(2)} = ${totals.customModelTotal.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Enrichment Credit Total:</span>
                  <span className="font-medium">
                    {(assignedCredits?.monthly_enrichment_limit || 0)} × ${resellPrices.enrichment.toFixed(2)} = ${totals.enrichmentTotal.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Pixel Credit Total:</span>
                  <span className="font-medium">
                    {(assignedCredits?.monthly_pixel_limit || 0)} × ${resellPrices.pixel.toFixed(2)} = ${totals.pixelTotal.toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Estimated Monthly Bill:</span>
                    <span>${totals.estimatedMonthlyBill.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
