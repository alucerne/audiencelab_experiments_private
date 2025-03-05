import { useEffect, useState } from 'react';

import { format, parse, subDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Path, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import { Calendar } from '@kit/ui/calendar';
import { CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@kit/ui/popover';
import { RadioGroup, RadioGroupItem } from '@kit/ui/radio-group';
import { cn } from '@kit/ui/utils';

import {
  AudienceFiltersFormValues,
  audienceFiltersFormSchema,
} from '~/lib/audience/schema/audience-filters-form.schema';

export const dateFields = [
  'dateRange',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

type DateRangeOptions = 'last2Days' | 'last5Days' | 'last7Days' | 'custom';

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

function parseDate(dateStr: string) {
  if (!dateStr) return undefined;
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

const today = new Date();
today.setHours(0, 0, 0, 0);

export default function DateStep() {
  const { control, watch, setValue } =
    useFormContext<z.infer<typeof audienceFiltersFormSchema>>();
  const [dateRange, setDateRange] = useState<DateRangeOptions>('last7Days');
  const dateRangeValue = watch('dateRange');

  function determineDateRangeOption(startDate: string, endDate: string) {
    if (!startDate || !endDate) return 'last7Days';

    if (startDate === formatDate(subDays(endDate, 1))) return 'last2Days';
    if (startDate === formatDate(subDays(endDate, 4))) return 'last5Days';
    if (startDate === formatDate(subDays(endDate, 6))) return 'last7Days';

    return 'custom';
  }

  useEffect(() => {
    const option = determineDateRangeOption(
      dateRangeValue.startDate,
      dateRangeValue.endDate,
    );
    setDateRange(option);
  }, []);

  function handleDateOptionChange(value: DateRangeOptions) {
    setDateRange(value);

    const endDate = formatDate(today);
    let startDate = endDate;

    switch (value) {
      case 'last2Days':
        startDate = formatDate(subDays(endDate, 1));
        break;
      case 'last5Days':
        startDate = formatDate(subDays(endDate, 4));
        break;
      case 'last7Days':
        startDate = formatDate(subDays(endDate, 6));
        break;
      case 'custom':
        return;
    }

    setValue('dateRange', { startDate, endDate });
  }

  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>Date Range</CardTitle>
        <CardDescription>
          What is your date range for this audience?
        </CardDescription>
      </CardHeader>
      <FormField
        control={control}
        name="dateRange"
        render={() => (
          <FormItem className="space-y-6">
            <FormControl>
              <RadioGroup
                onValueChange={(value) =>
                  handleDateOptionChange(value as DateRangeOptions)
                }
                value={dateRange}
                className="space-y-1"
              >
                <FormItem className="flex-row items-center space-y-0 space-x-3">
                  <RadioGroupItem value="last2Days" />
                  <FormLabel className="font-normal">Last 2 Days</FormLabel>
                </FormItem>
                <FormItem className="flex-row items-center space-y-0 space-x-3">
                  <RadioGroupItem value="last5Days" />
                  <FormLabel className="font-normal">Last 5 Days</FormLabel>
                </FormItem>
                <FormItem className="flex-row items-center space-y-0 space-x-3">
                  <RadioGroupItem value="last7Days" />
                  <FormLabel className="font-normal">Last 7 Days</FormLabel>
                </FormItem>
                <FormItem className="flex-row items-center space-y-0 space-x-3">
                  <RadioGroupItem value="custom" />
                  <FormLabel className="font-normal">Custom</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="dateRange.startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
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
                                format(parseDate(field.value)!, 'PPP')
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
                            selected={
                              field.value ? parseDate(field.value) : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(formatDate(date));
                              }
                            }}
                            disabled={(date) => {
                              const endDate = watch('dateRange.endDate');
                              return (
                                date > (endDate ? parseDate(endDate)! : today)
                              );
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="dateRange.endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
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
                                format(parseDate(field.value)!, 'PPP')
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
                            selected={
                              field.value ? parseDate(field.value) : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(formatDate(date));
                              }
                            }}
                            disabled={(date) => {
                              const startDate = watch('dateRange.startDate');
                              return (
                                (startDate
                                  ? date < parseDate(startDate)!
                                  : false) || date > today
                              );
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
