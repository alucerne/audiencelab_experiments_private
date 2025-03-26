import { z } from 'zod';

import {
  NumberRange,
  audienceFiltersFormSchema,
} from './schema/audience-filters-form.schema';

export function formatNumberRange(range: NumberRange) {
  if (range.min === null && range.max === null) return '';
  if (range.min === null) return `Up to ${range.max}`;
  if (range.max === null) return `${range.min}+`;
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

async function mapFiltersAttributes(
  attributes: z.infer<
    typeof audienceFiltersFormSchema
  >['filters']['attributes'],
) {
  attributes.credit_rating = attributes.credit_rating.map((v) => {
    if (v === '800+') return 'A';
    if (v === '750 - 799') return 'B';
    if (v === '700 - 749') return 'C';
    if (v === '650 - 699') return 'D';
    if (v === '600 - 649') return 'E';
    if (v === '550 - 599') return 'F';
    if (v === '500 - 549') return 'G';
    if (v === 'under 499') return 'H';
    return v;
  });

  attributes.credit_card_user = attributes.credit_card_user.map((v) =>
    v.toLowerCase() === 'yes' ? 'Y' : 'N',
  );

  attributes.cra_code = attributes.cra_code.map((v) => {
    if (v === 'low income') return '1';
    if (v === 'moderate income') return '2';
    if (v === 'middle income') return '3';
    if (v === 'high income') return '4';
    return v;
  });

  attributes.smoker = attributes.smoker.map((v) =>
    v.toLowerCase() === 'yes' ? 'Y' : 'N',
  );

  attributes.marital_status = attributes.marital_status.map((v) => {
    if (v === 'inferred married') return 'A';
    if (v === 'inferred single') return 'B';
    if (v === 'married') return 'M';
    if (v === 'single') return 'S';
    return v;
  });

  const parientValues = attributes.single_parent.map((v) => v.toLowerCase());
  attributes.single_parent =
    parientValues.includes('yes') && parientValues.includes('no')
      ? []
      : parientValues.map((v) => (v === 'yes' ? 'Y' : 'null'));

  if (attributes.ethnic_code.length > 0) {
    const { default: ethnicMapping } = await import(
      './filters-mappings/ethnic-code.json'
    );
    const lookup = ethnicMapping.reduce<Record<string, string>>(
      (acc, { name, id }) => {
        acc[name.toLowerCase()] = id;
        return acc;
      },
      {},
    );
    attributes.ethnic_code = attributes.ethnic_code.map(
      (name) => lookup[name.toLowerCase()] || name,
    );
  }

  if (attributes.language_code.length > 0) {
    const { default: languageMapping } = await import(
      './filters-mappings/language-code.json'
    );
    const lookup = languageMapping.reduce<Record<string, string>>(
      (acc, { name, id }) => {
        acc[name.toLowerCase()] = id;
        return acc;
      },
      {},
    );
    attributes.language_code = attributes.language_code.map(
      (name) => lookup[name.toLowerCase()] || name,
    );
  }

  attributes.investment = attributes.investment
    .filter((v) => v.toLowerCase() === 'investor')
    .map(() => 'Y');

  const occupationMap: Record<string, string> = {
    'professional / technical': 'A',
    'administration / managerial': 'B',
    'sales / service': 'C',
    'clerical / white collar': 'D',
    'craftsman / blue collar': 'E',
    student: 'F',
    homemaker: 'G',
    retired: 'H',
    farmer: 'I',
    military: 'J',
    religious: 'K',
    'self employed': 'L',
    'self employed - professional / technical': 'M',
    'self employed - administration / managerial': 'N',
    'self employed - sales / service': 'O',
    'self employed - clerical / white collar': 'P',
    'self employed - craftsman / blue collar': 'Q',
    'self employed - student': 'R',
    'self employed - homemaker': 'S',
    'self employed - retired': 'T',
    'self employed - other': 'U',
    educator: 'V',
    'financial professional': 'W',
    'legal professional': 'X',
    'medical professional': 'Y',
    other: 'Z',
  };

  attributes.occupation_group = attributes.occupation_group.map(
    (v) => occupationMap[v.toLowerCase()] || v,
  );

  if (attributes.occupation_type.length > 0) {
    const { default: occupationTypeMapping } = await import(
      './filters-mappings/occupation-type.json'
    );
    const lookup = occupationTypeMapping.reduce<Record<string, string>>(
      (acc, { name, id }) => {
        acc[name.toLowerCase()] = id;
        return acc;
      },
      {},
    );
    attributes.occupation_type = attributes.occupation_type.map(
      (name) => lookup[name.toLowerCase()] || name,
    );
  }

  attributes.estimated_home_value = attributes.estimated_home_value.map((v) => {
    if (v === 'under $50,000') return 'A';
    if (v === '$50,000 - $99,999') return 'B';
    if (v === '$100,000 - $149,999') return 'C';
    if (v === '$150,000 - $199,999') return 'D';
    return v;
  });

  const estimatedHomeValueMap: Record<string, string> = {
    '$1,000 - $24,999': 'A',
    '$25,000 - $49,999': 'B',
    '$50,000 - $74,999': 'C',
    '$75,000 - $99,999': 'D',
    '$100,000 - $124,999': 'E',
    '$125,000 - $149,999': 'F',
    '$150,000 - $174,999': 'G',
    '$175,000 - $199,999': 'H',
    '$200,000 - $224,999': 'I',
    '$225,000 - $249,999': 'J',
    '$250,000 - $274,999': 'K',
    '$275,000 - $299,999': 'L',
    '$300,000 - $349,999': 'M',
    '$350,000 - $399,999': 'N',
    '$400,000 - $449,999': 'O',
    '$450,000 - $499,999': 'P',
    '$500,000 - $749,999': 'Q',
    '$750,000 - $999,999': 'R',
    '$1,000,000 plus': 'S',
  };

  attributes.estimated_home_value = attributes.estimated_home_value.map(
    (v) => estimatedHomeValueMap[v] || v,
  );

  attributes.credit_range_new_credit = attributes.credit_range_new_credit.map(
    (v) => {
      if (v === '$0 - $100') return '0';
      if (v === '$101 - $300') return '1';
      if (v === '$301 - $500') return '2';
      if (v === '$501 - $1,000') return '3';
      if (v === '$1,001 - $3,000') return '4';
      if (v === '$3,001 - $5,000') return '5';
      if (v === '$5,001 - $9,999') return '6';
      if (v === 'Greater than $9,999') return '7';
      return v;
    },
  );

  return attributes;
}

async function mapFiltersProfile(
  profile: z.infer<typeof audienceFiltersFormSchema>['filters']['profile'],
) {
  profile.married = profile.married.map((v) =>
    v.toLowerCase() === 'yes' ? 'Y' : 'N',
  );

  profile.homeowner = profile.homeowner.map((v) => {
    if (v === 'probable homeowner 90-100') return 'P';
    if (v === 'homeowner') return 'Y';
    if (v === 'renter') return 'N';
    return v;
  });

  return profile;
}

export async function mapFilters(
  filters: z.infer<typeof audienceFiltersFormSchema>['filters'],
) {
  filters.gender = filters.gender.map((v) => {
    if (v === 'both') return 'B';
    if (v === 'male') return 'M';
    if (v === 'female') return 'F';
    if (v === 'unknown') return 'U';
    return v;
  });

  const statesMap: Record<string, string> = {
    Alabama: 'AL',
    Alaska: 'AK',
    Arizona: 'AZ',
    Arkansas: 'AR',
    California: 'CA',
    Colorado: 'CO',
    Connecticut: 'CT',
    Delaware: 'DE',
    Florida: 'FL',
    Georgia: 'GA',
    Hawaii: 'HI',
    Idaho: 'ID',
    Illinois: 'IL',
    Indiana: 'IN',
    Iowa: 'IA',
    Kansas: 'KS',
    Kentucky: 'KY',
    Louisiana: 'LA',
    Maine: 'ME',
    Maryland: 'MD',
    Massachusetts: 'MA',
    Michigan: 'MI',
    Minnesota: 'MN',
    Mississippi: 'MS',
    Missouri: 'MO',
    Montana: 'MT',
    Nebraska: 'NE',
    Nevada: 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    Ohio: 'OH',
    Oklahoma: 'OK',
    Oregon: 'OR',
    Pennsylvania: 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    Tennessee: 'TN',
    Texas: 'TX',
    Utah: 'UT',
    Vermont: 'VT',
    Virginia: 'VA',
    Washington: 'WA',
    'West Virginia': 'WV',
    Wisconsin: 'WI',
    Wyoming: 'WY',
  };

  filters.state = filters.state.map((v) => statesMap[v] || v);

  return {
    ...filters,
    attributes: await mapFiltersAttributes(filters.attributes),
    profile: await mapFiltersProfile(filters.profile),
  };
}
