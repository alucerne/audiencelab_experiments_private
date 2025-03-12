'use client';

import { cloneElement, useEffect, useState, useTransition } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  Activity,
  AlertCircle,
  Building2,
  CalendarDays,
  Database,
  FileSearch,
  FileX,
  Home,
  ListChecks,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Form } from '@kit/ui/form';
import { Separator } from '@kit/ui/separator';
import { cn } from '@kit/ui/utils';

import { TeamAccountLayoutPageHeader } from '~/home/[account]/_components/team-account-layout-page-header';
import {
  audienceFiltersFormDefaultValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';
import {
  addAudienceFiltersAction,
  getPreviewAudienceAction,
} from '~/lib/audience/server-actions';
import { Json } from '~/lib/database.types';

import AudienceStep, { audienceFields } from './audience-step';
import BusinessProfileStep, {
  businessProfileFields,
} from './business-profile-step';
import DateStep, { dateFields } from './date-step';
import EmailsStep, { emailsFields } from './emails-step';
import FamilyStep, { familyFields } from './family-step';
import FinancialStep, { financialFields } from './financial-step';
import HousingStep, { housingFields } from './housing-step';
import LifestyleStep, { lifestyleFields } from './lifestyle-step';
import LocationStep, { locationFields } from './location-step';
import PersonalStep, { personalFields } from './personal-step';
import PreviewAudienceTable from './preview-audience-table';

const today = new Date();
today.setHours(0, 0, 0, 0);

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

const steps = [
  {
    label: 'Audience Lists',
    description: 'Build your core target audience.',
    icon: <ListChecks />,
    component: <AudienceStep />,
    fields: audienceFields,
  },
  {
    label: 'Date',
    description: 'What is the date range for this audience?',
    icon: <CalendarDays />,
    component: <DateStep />,
    fields: dateFields,
  },
  {
    label: 'Business',
    description: 'What business characteristics does this audience represent?',
    icon: <Building2 />,
    component: <BusinessProfileStep />,
    fields: businessProfileFields,
  },
  {
    label: 'Financial',
    description: "What is your target audience's financial profile?",
    icon: <Wallet />,
    component: <FinancialStep />,
    fields: financialFields,
  },
  {
    label: 'Personal',
    description: 'What are the personal characteristics of your audience?',
    icon: <User />,
    component: <PersonalStep />,
    fields: personalFields,
  },
  {
    label: 'Lifestyle',
    description: 'What lifestyle characteristics define your target audience?',
    icon: <Activity />,
    component: <LifestyleStep />,
    fields: lifestyleFields,
  },
  {
    label: 'Family',
    description: "What is your audience's family composition?",
    icon: <Users />,
    component: <FamilyStep />,
    fields: familyFields,
  },
  {
    label: 'Housing',
    description: 'What type of housing does your target audience have?',
    icon: <Home />,
    component: <HousingStep />,
    fields: housingFields,
  },
  {
    label: 'Location',
    description: 'Where are they located?',
    icon: <MapPin />,
    component: <LocationStep />,
    fields: locationFields,
  },
  {
    label: 'Emails',
    description: 'What emails do you need from your audience?',
    icon: <Mail />,
    component: <EmailsStep />,
    fields: emailsFields,
  },
] as const;

export default function AudienceFiltersForm({
  defaultValues,
  audienceName,
}: {
  defaultValues?: Json;
  audienceName: string;
}) {
  const router = useRouter();
  const { account, id } = useParams<{ account: string; id: string }>();
  const [pending, startTransition] = useTransition();
  const [currentDialog, setCurrentDialog] = useState<number | null>(null);

  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

  const form = useForm<z.infer<typeof audienceFiltersFormSchema>>({
    resolver: zodResolver(audienceFiltersFormSchema),
    defaultValues: audienceFiltersFormDefaultValues,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      const parsedValues = audienceFiltersFormSchema.safeParse(defaultValues);

      if (parsedValues.success) {
        form.reset(parsedValues.data, {
          keepDefaultValues: true,
        });
      }
    }
  }, [defaultValues]);

  const dateRangeValue = form.watch('dateRange');

  useEffect(() => {
    if (!dateRangeValue.startDate && !dateRangeValue.endDate) {
      const endDate = formatDate(today);
      const startDate = formatDate(subDays(today, 6));
      form.setValue('dateRange', { startDate, endDate });
    }
  }, []);

  function openDialog(stepIndex: number) {
    setCurrentDialog(stepIndex);
  }

  async function handleDialogClose(_stepIndex: number) {
    setCurrentDialog(null);
  }

  function handleStepReset(stepIndex: number) {
    steps[stepIndex]?.fields.forEach((fieldName) => form.resetField(fieldName));
  }

  function onSubmit(values: z.infer<typeof audienceFiltersFormSchema>) {
    startTransition(() => {
      toast.promise(
        addAudienceFiltersAction({
          accountId,
          audienceId: id,
          filters: values,
        }),
        {
          loading: 'Generating audience...',
          success: () => {
            router.push(`/home/${account}`);

            return 'Audience generation in queue...';
          },
          error: 'Failed to generate audience',
        },
      );
    });
  }

  const {
    data: previewData,
    mutate: getPreview,
    isIdle,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      return await getPreviewAudienceAction({ id, filters: form.getValues() });
    },
  });

  function onError(errors: unknown) {
    if (errors && typeof errors === 'object' && errors !== null) {
      const errorObj = errors as Record<string, { message?: string }>;
      const errorKeys = Object.keys(errorObj);

      if (errorKeys.length > 0) {
        const firstErrorField = errorKeys[0]!;
        const errorMessage = errorObj[firstErrorField]?.message;

        toast.error(errorMessage ?? 'Form validation failed');
      } else {
        toast.error('Form validation failed');
      }
    } else {
      toast.error('An error occurred');
    }
  }

  return (
    <>
      <div className="flex-none">
        <div className="flex flex-col justify-between pb-6 min-[896px]:flex-row lg:pr-4 lg:pb-0">
          <TeamAccountLayoutPageHeader
            account={account}
            title={`${audienceName} Audience Filters`}
            description={<AppBreadcrumbs uuidLabel="Filters" />}
          />
          <div className="flex flex-col-reverse items-center gap-4 md:flex-row">
            {previewData && (
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium whitespace-nowrap">
                  <span className="font-semibold">
                    {previewData.count.toLocaleString()}
                  </span>{' '}
                  {` result${previewData.count === 1 ? '' : 's found'}`}
                </div>
                <Separator
                  orientation={'vertical'}
                  className="hidden h-5 md:block"
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <Button
                type="button"
                disabled={pending}
                className="px-3 py-1.5"
                variant="secondary"
                onClick={() =>
                  form.trigger().then((isValid) => {
                    if (isValid) {
                      getPreview();
                    } else {
                      onError(form.formState.errors);
                    }
                  })
                }
              >
                <Search className="mr-2 size-4" />
                Preview
              </Button>
              <Button
                type="submit"
                disabled={pending || !form.formState.isValid}
                className="px-3 py-1.5"
                onClick={() => form.handleSubmit(onSubmit, onError)()}
              >
                <Database className="mr-2 size-4" />
                Generate Audience
              </Button>
            </div>
          </div>
        </div>
        <Form {...form}>
          <form
            className="relative"
            onSubmit={form.handleSubmit(onSubmit, onError)}
          >
            <div className="border-muted-foreground/20 flex flex-wrap items-center gap-2 border-b-2 pb-3 lg:px-4">
              {steps.map((step, index) => {
                const appliedCount = step.fields.reduce((count, fieldName) => {
                  const value = form.getValues(fieldName);
                  if (
                    fieldName === 'filters.businessProfile' ||
                    fieldName === 'audience'
                  ) {
                    return count + countBusinessProfile(value);
                  }
                  return count + countFilterValue(value);
                }, 0);

                const iconWithClasses = cloneElement(step.icon, {
                  className: cn('size-4', step.icon.props?.className),
                });

                return (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5',
                      appliedCount > 0 &&
                        'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                    )}
                    onClick={() => openDialog(index)}
                  >
                    {iconWithClasses}
                    {step.label}
                    {appliedCount > 0 && (
                      <span className="text-muted-foreground text-xs">
                        ({appliedCount} applied)
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            {steps.map((step, index) => (
              <Dialog
                key={index}
                open={currentDialog === index}
                onOpenChange={(open) => !open && handleDialogClose(index)}
              >
                <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 px-0">
                  <DialogHeader className="border-b px-6 pb-4">
                    <DialogTitle className="flex items-center gap-2">
                      {step.icon}
                      <span>{step.label}</span>
                    </DialogTitle>
                    <DialogDescription>{step.description}</DialogDescription>
                  </DialogHeader>
                  <div
                    className="flex-1 space-y-6 overflow-y-auto px-6 py-8"
                    style={{ maxHeight: '80vh' }}
                  >
                    {step.component}
                  </div>
                  <DialogFooter className="border-t px-6 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleStepReset(index)}
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDialogClose(index)}
                    >
                      Continue
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </form>
        </Form>
      </div>
      <div className="bg-muted h-full flex-1 overflow-y-auto">
        {isIdle && (
          <div className="flex h-[80%] flex-col items-center justify-center">
            <div className="max-w-md text-center">
              <FileSearch className="mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-medium">
                Preview Your Audience
              </h3>
              <p className="text-muted-foreground mb-6">
                Customize your filters to build your audience. Get started by
                building your core target audience.
              </p>
              {form.getValues('segment').length > 0 ? (
                <Button
                  type="button"
                  className="mx-auto"
                  onClick={() =>
                    form.trigger().then((isValid) => {
                      if (isValid) {
                        getPreview();
                      } else {
                        onError(form.formState.errors);
                      }
                    })
                  }
                >
                  <Search className="mr-2 size-4" />
                  Get Preview
                </Button>
              ) : (
                <Button
                  type="button"
                  className="mx-auto"
                  onClick={() => setCurrentDialog(0)}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  Build Audience
                </Button>
              )}
            </div>
          </div>
        )}
        {isPending && (
          <div className="flex h-[80%] flex-col items-center justify-center">
            <Loader2 className="size-12 animate-spin" />
            <h3 className="mt-6 mb-2 text-lg font-medium">
              Generating Audience Preview
            </h3>
            <p className="text-muted-foreground max-w-md text-center text-sm">
              We&apos;re analyzing your filters and determining matching
              profiles. This may take a few moments...
            </p>
          </div>
        )}
        {isError && (
          <div className="flex h-[80%] flex-col items-center justify-center text-center">
            <AlertCircle className="text-destructive mb-4 h-12 w-12" />
            <h3 className="text-destructive mb-2 text-lg font-medium">
              Preview Generation Failed
            </h3>
            <p className="text-destructive mb-6 max-w-md">
              {error instanceof Error
                ? error.message
                : 'We encountered an issue while generating your audience preview. Please try adjusting your filters or try again later.'}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => getPreview()}
              className="mx-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
        {previewData && previewData.result.length === 0 && (
          <div className="flex h-[80%] flex-col items-center justify-center text-center">
            <FileX className="mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-medium">
              No Matching Profiles Found
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Your current filter selection doesn&apos;t match any profiles in
              our database. Try broadening your criteria to see results.
            </p>
          </div>
        )}
        {previewData && previewData.result.length > 0 && (
          <PreviewAudienceTable data={previewData.result} />
        )}
      </div>
    </>
  );
}

function countFilterValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item) => item != null && item !== '').length;
  } else if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    const hasValue = entries.some(([, v]) => v != null && v !== '');
    return hasValue ? 1 : 0;
  } else if (typeof value === 'string') {
    return value.trim() !== '' ? 1 : 0;
  } else if (typeof value === 'number') {
    return 1;
  }
  return 0;
}

function countBusinessProfile(value: unknown) {
  if (!value || typeof value !== 'object') return 0;
  return Object.values(value as Record<string, unknown>).reduce<number>(
    (sum, subVal) => {
      if (Array.isArray(subVal)) {
        return (
          sum +
          (subVal.filter((item) => item != null && item !== '').length > 0
            ? 1
            : 0)
        );
      }
      return 0;
    },
    0,
  );
}
