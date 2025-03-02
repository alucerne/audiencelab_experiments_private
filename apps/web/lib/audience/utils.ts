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
