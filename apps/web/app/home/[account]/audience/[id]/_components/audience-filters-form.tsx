'use client';

import { useEffect, useState, useTransition } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { format, subDays } from 'date-fns';
import {
  Activity,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
import { Button } from '@kit/ui/button';
import { Form } from '@kit/ui/form';

import {
  audienceFiltersFormDefaultValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';
import { addAudienceFiltersAction } from '~/lib/audience/server-actions';
import { Json } from '~/lib/database.types';

import AudienceFiltersStepper from './audience-filters-stepper';
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
  const [step, setStep] = useState(0);

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
      label: 'Premade',
      description: 'Start with a premade audience list.',
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
      description: 'What is their business like?',
      icon: <Building2 />,
      component: <BusinessProfileStep />,
      fields: businessProfileFields,
    },
    {
      label: 'Financial',
      description: 'What is their financial situation?',
      icon: <Wallet />,
      component: <FinancialStep />,
      fields: financialFields,
    },
    {
      label: 'Personal',
      description: 'What are their personal characteristics?',
      icon: <User />,
      component: <PersonalStep />,
      fields: personalFields,
    },
    {
      label: 'Lifestyle',
      description: 'What is their lifestyle like?',
      icon: <Activity />,
      component: <LifestyleStep />,
      fields: lifestyleFields,
    },
    {
      label: 'Family',
      description: 'What is their family like?',
      icon: <Users />,
      component: <FamilyStep />,
      fields: familyFields,
    },
    {
      label: 'Housing',
      description: 'What is their housing situation?',
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
      description: 'What emails are needed?',
      icon: <Mail />,
      component: <EmailsStep />,
      fields: emailsFields,
    },
  ] as const;

  const onNext = async () => {
    const isValid = await form.trigger(steps[step]?.fields);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const onPrevious = () => {
    setStep(step - 1);
  };

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
      const startDate = formatDate(subDays(endDate, 6));
      form.setValue('dateRange', { startDate, endDate });
    }
  }, []);

  return (
    <Form {...form}>
      <form
        className="relative flex h-full"
        onSubmit={form.handleSubmit(
          (values) => onSubmit(values, false),
          onError,
        )}
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' &&
            e.target instanceof HTMLElement &&
            e.target.tagName !== 'TEXTAREA'
          ) {
            e.preventDefault();
          }
        }}
      >
        <AudienceFiltersStepper
          steps={steps}
          currentStep={step}
          setStep={setStep}
          pending={pending}
          isUpdate={isUpdate}
          handlePreviewSubmit={handlePreviewSubmit}
        />
        <div className="flex h-full flex-1 flex-col">
          <div className="flex-1 px-8">
            <div className="space-y-6">{steps[step]?.component}</div>
          </div>
          <div className="bg-background sticky bottom-0 mt-6 border-t px-8 py-4">
            <div className="flex w-full flex-row-reverse justify-between">
              {step === steps.length - 1 && (
                <div className="flex items-center gap-3">
                  {!isUpdate && (
                    <Button
                      type="submit"
                      disabled={pending}
                      variant="secondary"
                      onClick={handlePreviewSubmit}
                    >
                      Preview
                    </Button>
                  )}
                  <Button type="submit" disabled={pending}>
                    {isUpdate ? 'Refresh' : 'Generate'}
                  </Button>
                </div>
              )}
              {step < steps.length - 1 && (
                <Button
                  type="button"
                  onClick={onNext}
                  className="place-self-end justify-self-end"
                >
                  Next
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              {step > 0 && (
                <Button type="button" onClick={onPrevious} variant="outline">
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Previous
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
