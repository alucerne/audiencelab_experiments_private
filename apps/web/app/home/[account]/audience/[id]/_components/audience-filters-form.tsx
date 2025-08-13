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
  FilterMode,
  BooleanExpression,
  defaultBooleanExpression,
  zAudienceFilters,
  zBooleanExpression,
  AudienceFilters
} from '~/lib/audience/schema/boolean-filters.schema';
import {
  addAudienceFiltersAction,
  getPreviewAudienceAction,
} from '~/lib/audience/server-actions';
import { booleanToQueries } from '~/lib/audience/boolean-transform';
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
import { BuilderHeader } from './BuilderHeader';
import { BooleanBuilder } from './boolean-builder';

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
  const [builderMode, setBuilderMode] = useState<FilterMode>('simple');
  const [booleanExpression, setBooleanExpression] = useState<BooleanExpression>(defaultBooleanExpression);

  // Handle mode change
  const handleModeChange = (newMode: FilterMode) => {
    setBuilderMode(newMode);
    // Clear form errors when switching modes
    if (newMode === 'boolean') {
      form.clearErrors();
    }
  };

  // Validation function for boolean expression
  const isBooleanExpressionValid = (expression: BooleanExpression): boolean => {
    try {
      zBooleanExpression.parse(expression);
      return expression.children.length > 0;
    } catch {
      return false;
    }
  };

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

  const { isUpdate, originalSegment } = useMemo(() => {
    if (!defaultValues) return { isUpdate: false, originalSegment: null };

    const parsed = audienceFiltersFormSchema.safeParse(defaultValues);

    return {
      isUpdate: parsed.success,
      originalSegment: parsed.success ? parsed.data.segment : null,
    };
  }, [defaultValues]);

  const steps = [
    {
      label: 'Intent',
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
    console.log('Form submission - builderMode:', builderMode);
    console.log('Form submission - values:', values);
    console.log('Form submission - booleanExpression:', booleanExpression);
    
    startTransition(() => {
      // Prepare filters based on builder mode
      let filters: AudienceFilters;
      
      if (builderMode === 'boolean') {
        // Validate boolean expression
        const booleanValidation = zAudienceFilters.safeParse({
          mode: 'boolean',
          boolean: { expression: booleanExpression }
        });
        
        if (!booleanValidation.success) {
          console.error('Boolean validation failed:', booleanValidation.error);
          toast.error('Invalid boolean expression');
          return;
        }
        
        filters = {
          mode: 'boolean',
          boolean: { expression: booleanExpression },
          simple: values // Keep simple filters for backward compatibility
        };
      } else {
        // Simple mode - use existing structure
        filters = {
          mode: 'simple',
          simple: values
        };
      }

      console.log('Sending filters to server action:', filters);
      toast.promise(
        addAudienceFiltersAction({
          accountId,
          audienceId: id,
          filters: filters as any, // Type assertion for backward compatibility
          hasSegmentChanged: isUpdate && hasSegmentChanged,
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
    mutationFn: () => {
      const formValues = form.getValues();
      let filters: any;
      
      if (builderMode === 'boolean') {
        filters = {
          mode: 'boolean',
          boolean: { expression: booleanExpression },
          simple: formValues
        };
      } else {
        filters = formValues;
      }
      
      return getPreviewAudienceAction({ accountId, id, filters });
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

  const segmentList = form.watch('segment');

  useEffect(() => {
    const currentValue = form.getValues('daysBack');

    if (segmentList.length === 0 && currentValue !== null) {
      form.setValue('daysBack', null);
    } else if (segmentList.length > 0 && currentValue === null) {
      form.setValue('daysBack', 7);
    }
  }, [segmentList]);

  const hasSegmentChanged = useMemo(() => {
    if (!originalSegment || !segmentList) return false;

    const original = originalSegment.map((s) => s.toLowerCase()).sort();
    const current = segmentList.map((s) => s.toLowerCase()).sort();

    return (
      original.length !== current.length ||
      original.some((value, index) => value !== current[index])
    );
  }, [originalSegment, segmentList]);

  return (
    <>
      <div className="flex-none">
        <BuilderHeader
          mode={builderMode}
          onModeChange={handleModeChange}
          b2bAccess={limits.b2bAccess}
          audienceName={audienceName}
          onPreview={() => {
            if (builderMode === 'boolean') {
              // In boolean mode, validate the boolean expression
              if (isBooleanExpressionValid(booleanExpression)) {
                getPreview();
              } else {
                toast.error('Please add at least one valid rule to the Boolean Builder');
              }
            } else {
              // In simple mode, validate the form
              form.trigger().then((isValid) => {
                if (isValid) {
                  getPreview();
                } else {
                  onError(form.formState.errors);
                }
              });
            }
          }}
          onGenerate={() => setShowConfirm(true)}
          pending={pending}
          isValid={builderMode === 'boolean' ? isBooleanExpressionValid(booleanExpression) : form.formState.isValid}
          isUpdate={isUpdate}
        />
        <Form {...form}>
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
              if (builderMode === 'boolean') {
                // In boolean mode, handle submission directly
                if (isBooleanExpressionValid(booleanExpression)) {
                  onSubmit(form.getValues());
                } else {
                  toast.error('Please add at least one valid rule to the Boolean Builder');
                }
              } else {
                // In simple mode, use the normal form submission
                form.handleSubmit(onSubmit, onError)(e);
              }
            }}
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
                      (!limits.intentAccess && step.label === 'Intent') ||
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
            
            {/* Boolean Builder */}
            {builderMode === 'boolean' && (
              <div className="mt-6">
                <BooleanBuilder
                  expression={booleanExpression}
                  onChange={setBooleanExpression}
                  onReset={() => setBooleanExpression(defaultBooleanExpression)}
                  simpleFilters={form.getValues()}
                />
              </div>
            )}
            
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isUpdate
                      ? 'Confirm Audience Update'
                      : 'Confirm Audience Generation'}
                  </DialogTitle>
                  <DialogDescription className="flex flex-col space-y-2">
                    {isUpdate ? (
                      <span>This will queue your audience to be updated.</span>
                    ) : (
                      'This will queue your audience for generation.'
                    )}
                    {isUpdate && hasSegmentChanged && (
                      <span>
                        NOTE: Your have updated your intents since creating this
                        audience! Generating a new audience will require using
                        another usage credit.
                      </span>
                    )}
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
