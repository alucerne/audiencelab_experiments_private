'use client';

import { useState, useTransition } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Activity,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home,
  Mail,
  MapPin,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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

export default function AudienceFiltersForm({
  defaultValues,
}: {
  defaultValues?: Json;
}) {
  const router = useRouter();
  const { account, id } = useParams<{ account: string; id: string }>();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

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

  function onSubmit(values: z.infer<typeof audienceFiltersFormSchema>) {
    const fieldsToCheck = Object.keys(audienceFiltersFormDefaultValues).filter(
      (key) => key !== 'jobId' && key !== 'dateRange',
    );

    const hasNoFilters = fieldsToCheck.every((key) => {
      const typedKey = key as keyof typeof audienceFiltersFormDefaultValues;
      return (
        JSON.stringify(values[typedKey]) ===
        JSON.stringify(audienceFiltersFormDefaultValues[typedKey])
      );
    });

    if (hasNoFilters) {
      toast.error('Please add at least 1 filter.');
      return;
    }

    startTransition(() => {
      toast.promise(
        addAudienceFiltersAction({
          audienceId: id,
          filters: values,
        }),
        {
          loading: `${isUpdate ? 'Updating' : 'Adding'} audience filters...`,
          success: () => {
            router.push(`/home/${account}`);

            return `Audience filters ${isUpdate ? 'updated' : 'added'}`;
          },
          error: `Failed to ${isUpdate ? 'update' : 'add'} audience filters`,
        },
      );
    });
  }

  return (
    <Form {...form}>
      <form
        className="relative flex h-full"
        onSubmit={form.handleSubmit(onSubmit)}
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
        />
        <div className="flex h-full flex-1 flex-col">
          <div className="flex-1 px-8">
            <div className="space-y-6">{steps[step]?.component}</div>
          </div>
          <div className="bg-background sticky bottom-0 mt-6 border-t px-8 py-4">
            <div className="flex w-full flex-row-reverse justify-between">
              {step === steps.length - 1 && (
                <Button
                  type="submit"
                  disabled={pending || !form.formState.isValid}
                >
                  {isUpdate ? 'Update' : 'Add'} Filters
                </Button>
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
