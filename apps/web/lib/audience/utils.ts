import { NumberRange } from './schema/audience-filters-form.schema';

export function formatNumberRange(range: NumberRange) {
  return `${range.min} - ${range.max}`;
}

export function isRangeInput(value: unknown): value is NumberRange {
  return (
    typeof value === 'object' &&
    value !== null &&
    'min' in value &&
    'max' in value
  );
}

export function getDateRange(dateRange: number) {
  const currentDate = new Date();

  const startDate = new Date(currentDate);
  startDate.setUTCDate(currentDate.getUTCDate() - dateRange + 1);
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(currentDate);
  endDate.setUTCDate(currentDate.getUTCDate() - 1);
  endDate.setUTCHours(0, 0, 0, 0);

  const startDateStr = startDate.toISOString().split('T')[0]!;
  const endDateStr = endDate.toISOString().split('T')[0]!;

  return {
    startDate: startDateStr,
    endDate: endDateStr,
  };
}
