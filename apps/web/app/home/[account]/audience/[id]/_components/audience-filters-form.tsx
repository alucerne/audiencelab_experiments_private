'use client';

import { cloneElement, useEffect, useState, useTransition } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { format, subDays } from 'date-fns';
import {
  Activity,
  Building2,
  CalendarDays,
  Home,
  ListChecks,
  Mail,
  MapPin,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Badge } from '@kit/ui/badge';
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

import {
  audienceFiltersFormDefaultValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';
import { addAudienceFiltersAction } from '~/lib/audience/server-actions';
import { Json } from '~/lib/database.types';

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
import PremadeStep, { premadeFields } from './premade-step';

const today = new Date();
today.setHours(0, 0, 0, 0);

export default function AudienceFiltersForm({
  defaultValues,
}: {
  defaultValues?: Json;
}) {
  const router = useRouter();
  const { account, id } = useParams<{ account: string; id: string }>();
  const [pending, startTransition] = useTransition();
  const [currentDialog, setCurrentDialog] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const {
    account: { id: accountId },
  } = useTeamAccountWorkspace();

  const isUpdate = defaultValues
    ? Object.keys(defaultValues).length > 0
    : false;

  const form = useForm<z.infer<typeof audienceFiltersFormSchema>>({
    resolver: zodResolver(audienceFiltersFormSchema),
    defaultValues: audienceFiltersFormSchema.safeParse(defaultValues).success
      ? audienceFiltersFormSchema.parse(defaultValues)
      : audienceFiltersFormDefaultValues,
    mode: 'onSubmit',
  });

  const steps = [
    {
      label: 'Premade Lists',
      description: 'Choose from our premade audience lists to get started.',
      icon: <ListChecks />,
      component: <PremadeStep />,
      fields: premadeFields,
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
      label: 'Lifestyle',
      description:
        'What lifestyle characteristics define your target audience?',
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

  function isStepCompleted(stepIndex: number) {
    return completedSteps.includes(stepIndex);
  }

  function openDialog(stepIndex: number) {
    setCurrentDialog(stepIndex);
  }

  async function handleDialogClose(stepIndex: number) {
    const step = steps[stepIndex];
    if (step !== undefined) {
      const isValid = await form.trigger(step.fields);
      if (isValid) {
        const appliedCount = step.fields.reduce((count, fieldName) => {
          const value = form.getValues(fieldName);
          if (fieldName === 'filters.businessProfile') {
            return count + countBusinessProfile(value);
          }
          return count + countFilterValue(value);
        }, 0);

        if (!completedSteps.includes(stepIndex) && appliedCount > 0) {
          setCompletedSteps([...completedSteps, stepIndex]);
        }
        setCurrentDialog(null);
      }
    }
  }

  function handleStepReset(stepIndex: number) {
    steps[stepIndex]?.fields.forEach((fieldName) => {
      form.resetField(fieldName);
    });
    setCompletedSteps((prev) => prev.filter((i) => i !== stepIndex));
    setCurrentDialog(null);
  }

  function onSubmit(
    values: z.infer<typeof audienceFiltersFormSchema>,
    isPreview: boolean = false,
  ) {
    startTransition(() => {
      toast.promise(
        addAudienceFiltersAction({
          accountId,
          audienceId: id,
          filters: values,
        }),
        {
          loading: `${isUpdate ? 'Refreshing' : isPreview ? 'Getting preview' : 'Generating'} audience...`,
          success: () => {
            if (isPreview) {
              router.push(`/home/${account}/audience/${id}/preview`);
            } else {
              router.push(`/home/${account}`);
            }
            return `Audience ${isUpdate ? 'refresh' : isPreview ? 'preview' : 'generation'} in queue...`;
          },
          error: `Failed to ${isUpdate ? 'refresh' : 'generate'} audience`,
        },
      );
    });
  }

  function handlePreviewSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    console.log("handlePreviewSubmit");
    e.preventDefault();
    form.handleSubmit((values) => onSubmit(values, true))();
  }

  function onError(errors: unknown) {
    if (errors && typeof errors === 'object' && errors !== null) {
      const errorObj = errors as Record<string, { message?: string }>;
      const errorKeys = Object.keys(errorObj);

      if (errorKeys.length > 0) {
        const firstErrorField = errorKeys[0]!;
        const errorMessage = errorObj[firstErrorField]?.message;

        if (errorMessage) {
          toast.error(errorMessage);
        } else {
          toast.error('Form validation failed');
        }
      } else {
        toast.error('Form validation failed');
      }
    } else {
      toast.error('An error occurred');
    }
  }

  const dateRangeValue = form.watch('dateRange');
  const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

  useEffect(() => {
    if (
      !dateRangeValue ||
      (!dateRangeValue.startDate && !dateRangeValue.endDate)
    ) {
      const endDate = formatDate(today);
      const startDate = formatDate(subDays(today, 6));
      form.setValue('dateRange', { startDate, endDate });
    }
  }, []);

  console.log('form values', form.getValues());

  return (
    <Form {...form}>
      <form
        className="relative"
        onSubmit={form.handleSubmit(
          (values) => onSubmit(values, false),
          onError,
        )}
      >
        <div className="flex flex-wrap gap-2 px-6">
          {steps.map((step, index) => {
            const appliedCount = step.fields.reduce((count, fieldName) => {
              const value = form.getValues(fieldName);
              if (fieldName === 'filters.businessProfile') {
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
                className={`flex items-center gap-1.5 px-3 py-1.5 ${
                  appliedCount > 0 && isStepCompleted(index)
                    ? 'border-primary border'
                    : ''
                }`}
                onClick={() => openDialog(index)}
              >
                {iconWithClasses}
                {appliedCount > 0 && isStepCompleted(index) && (
                  <Badge variant="success" className="ml-2">
                    {appliedCount}
                  </Badge>
                )}
                <div className="font-medium">{step.label}</div>
              </Button>
            );
          })}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={pending || completedSteps.length === 0}
              className="px-3 py-1.5"
              variant="secondary"
              onClick={handlePreviewSubmit}
            >
              Preview
            </Button>
            <Button
              type="submit"
              disabled={pending || completedSteps.length === 0}
              className="px-3 py-1.5"
            >
              {isUpdate ? 'Refresh' : 'Generate'}
            </Button>
          </div>
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
                style={{ maxHeight: '60vh' }}
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
                <Button type="button" onClick={() => handleDialogClose(index)}>
                  Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ))}
      </form>
    </Form>
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
    (sum, subVal) => sum + countFilterValue(subVal),
    0,
  );
}
