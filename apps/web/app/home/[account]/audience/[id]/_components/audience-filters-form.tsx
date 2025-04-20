'use client';

import {
  cloneElement,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
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
import { Path, PathValue, useForm } from 'react-hook-form';
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
import EmailsStep, { emailsFields } from './contact-step';
import DateStep, { dateFields } from './date-step';
import FamilyStep, { familyFields } from './family-step';
import FinancialStep, { financialFields } from './financial-step';
import HousingStep, { housingFields } from './housing-step';
import LocationStep, { locationFields } from './location-step';
import PersonalStep, { personalFields } from './personal-step';
import PreviewAudienceTable from './preview-audience-table';
import UpdateAudienceNameDialog from './update-audience-name-dialog';

export default function AudienceFiltersForm({
  defaultValues,
  audienceName,
  limits,
}: {
  defaultValues?: Json;
  audienceName: string;
  limits: {
    canCreateCustomInterests: boolean;
    b2bAccess: boolean;
    intentAccess: boolean;
  };
}) {
  const router = useRouter();
  const { account, id } = useParams<{ account: string; id: string }>();
  const [pending, startTransition] = useTransition();
  const [currentDialog, setCurrentDialog] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const isUpdate = useMemo(() => {
    if (!defaultValues) return false;

    const parsed = audienceFiltersFormSchema.safeParse(defaultValues);

    return parsed.success;
  }, [defaultValues]);

  const steps = [
    {
      label: 'Audience Lists',
      description: 'Build your core target audience.',
      icon: <ListChecks />,
      component: <AudienceStep limits={limits} />,
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
      description:
        'What business characteristics does this audience represent?',
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
      label: 'Contact',
      description: 'What contact information should be included?',
      icon: <Mail />,
      component: <EmailsStep />,
      fields: emailsFields,
    },
  ] as const;

  const watchedValues = form.watch();

  function getDefault<
    K extends Path<z.infer<typeof audienceFiltersFormSchema>>,
  >(path: K) {
    const keys = path.split('.');
    let result: unknown = audienceFiltersFormDefaultValues;

    for (const key of keys) {
      if (result == null || typeof result !== 'object') break;
      result = (result as Record<string, unknown>)[key];
    }

    return result as PathValue<z.infer<typeof audienceFiltersFormSchema>, K>;
  }

  function isStepAtDefault(
    fields: readonly Path<z.infer<typeof audienceFiltersFormSchema>>[],
  ) {
    return fields.every((path) => {
      const current = form.getValues(path);
      const def = getDefault(path);
      return JSON.stringify(current) === JSON.stringify(def);
    });
  }

  const hasChanged = useMemo(
    () =>
      JSON.stringify(watchedValues) !==
      JSON.stringify(audienceFiltersFormDefaultValues),
    [watchedValues],
  );

  function openDialog(stepIndex: number) {
    setCurrentDialog(stepIndex);
  }

  function handleDialogClose(_stepIndex: number) {
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
          loading: isUpdate ? 'Updating audience...' : 'Generating audience...',
          success: () => {
            router.push(`/home/${account}`);
            return isUpdate
              ? 'Audience update in queue...'
              : 'Audience generation in queue...';
          },
          error: `Failed to ${isUpdate ? 'update' : 'generate'} audience`,
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
  } = useMutation({
    mutationFn: () =>
      getPreviewAudienceAction({ accountId, id, filters: form.getValues() }),
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

  const segmentList = form.watch('segment');

  useEffect(() => {
    const currentValue = form.getValues('audience.dateRange');

    if (segmentList.length === 0 && currentValue !== null) {
      form.setValue('audience.dateRange', null);
    } else if (segmentList.length > 0 && currentValue !== 7) {
      form.setValue('audience.dateRange', 7);
    }
  }, [segmentList]);

  return (
    <>
      <div className="flex-none">
        <div className="flex flex-col justify-between pb-6 min-[896px]:flex-row lg:pr-4 lg:pb-0">
          <TeamAccountLayoutPageHeader
            account={account}
            title={
              <div className="flex items-center gap-1.5">
                {`${audienceName} Audience Filters`}
                <UpdateAudienceNameDialog
                  audienceId={id}
                  audienceName={audienceName}
                />
              </div>
            }
            description={<AppBreadcrumbs uuidLabel="Filters" />}
          />
          <div className="flex flex-col-reverse items-center gap-4 md:flex-row">
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
                type="button"
                disabled={pending || !form.formState.isValid}
                className="px-3 py-1.5"
                onClick={() => setShowConfirm(true)}
              >
                <Database className="mr-2 size-4" />
                {isUpdate ? 'Update Audience' : 'Generate Audience'}
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
                    disabled={
                      (!limits.intentAccess &&
                        step.label === 'Audience Lists') ||
                      (step.label === 'Date' && segmentList.length === 0)
                    }
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
                      disabled={isStepAtDefault(step.fields)}
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
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isUpdate
                      ? 'Confirm Audience Update'
                      : 'Confirm Audience Generation'}
                  </DialogTitle>
                  <DialogDescription>
                    {isUpdate
                      ? 'This will queue your audience to be updated.'
                      : 'This will queue your audience for generation.'}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowConfirm(false);
                      form.handleSubmit(onSubmit, onError)();
                    }}
                  >
                    {isUpdate ? 'Update' : 'Generate'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </form>
        </Form>
      </div>
      {isIdle && (
        <div className="bg-muted flex flex-1 flex-col items-center justify-center pb-20">
          <FileSearch className="mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">Preview Your Audience</h3>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            Customize your filters to build your audience. Get started by
            building your core target audience.
          </p>
          {hasChanged ? (
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
      )}
      {isPending && (
        <div className="bg-muted flex flex-1 flex-col items-center justify-center pb-20">
          <Loader2 className="size-12 animate-spin" />
          <h3 className="mt-6 mb-2 text-lg font-medium">
            Generating Audience Preview
          </h3>
          <p className="text-muted-foreground max-w-md text-center text-sm">
            We&apos;re analyzing your filters and determining matching profiles.
            This may take a few moments...
          </p>
        </div>
      )}
      {isError && (
        <div className="bg-muted flex flex-1 flex-col items-center justify-center pb-20">
          <AlertCircle className="text-destructive mb-4 h-12 w-12" />
          <h3 className="text-destructive mb-2 text-lg font-medium">
            Preview Generation Failed
          </h3>
          <p className="text-destructive mb-6 max-w-md text-center">
            An error occurred while generating the audience preview.
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
        <div className="bg-muted flex flex-1 flex-col items-center justify-center pb-20">
          <FileX className="mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">
            No Matching Profiles Found
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            Your current filter selection doesn&apos;t match any profiles in our
            database. Try broadening your criteria to see results.
          </p>
        </div>
      )}
      {previewData && previewData.result.length > 0 && (
        <PreviewAudienceTable
          data={previewData.result}
          previewDataCount={previewData.count}
        />
      )}
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
