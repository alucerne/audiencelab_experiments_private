import { z } from 'zod';

const numberRangeSchema = z
  .object({
    min: z.number().nullable(),
    max: z.number().nullable(),
  })
  .refine(
    (data) => {
      if (data.min === null || data.max === null) {
        return true;
      }
      return data.min <= data.max;
    },
    {
      message: 'Minimum must be less than or equal to maximum',
    },
  );

export type NumberRange = z.infer<typeof numberRangeSchema>;

export const audienceFiltersFormSchema = z.object({
  jobId: z.string(),
  segment: z.array(z.string()).min(1, 'Please select at least 1 premade list.'),
  score: z.array(z.string()),
  dateRange: z.object({
    startDate: z.string().date(),
    endDate: z.string().date(),
  }),
  filters: z.object({
    age: z.object({
      minAge: z.number().nullable(),
      maxAge: z.number().nullable(),
    }),
    city: z.array(z.string()),
    state: z.array(z.string()),
    zip: z.array(z.number()),
    gender: z.array(z.string()),
    profile: z.object({
      incomeRange: z.array(z.string()),
      homeowner: z.array(z.string()),
      married: z.array(z.string()),
      netWorth: z.array(z.string()),
      children: z.array(z.string()),
    }),
    businessProfile: z.object({
      jobTitle: z.array(z.string()),
      seniority: z.array(z.string()),
      department: z.array(z.string()),
      companyName: z.array(z.string()),
      companyDomain: z.array(z.string()),
      industry: z.array(z.string()),
      sic: z.array(z.string()),
      employeeCount: z.array(z.string()),
      companyRevenue: z.array(z.string()),
      companyNaics: z.array(z.string()),
    }),
    attributes: z.object({
      credit_rating: z.array(z.string()),
      language_code: z.array(z.string()),
      occupation_group: z.array(z.string()),
      occupation_type: z.array(z.string()),
      home_year_built: numberRangeSchema,
      single_parent: z.array(z.string()),
      cra_code: z.array(z.string()),
      dwelling_type: z.array(z.string()),
      credit_range_new_credit: z.array(z.string()),
      ethnic_code: z.array(z.string()),
      marital_status: z.array(z.string()),
      net_worth: z.array(z.string()),
      education: z.array(z.string()),
      credit_card_user: z.array(z.string()),
      investment: z.array(z.string()),
      smoker: z.array(z.string()),
      donate_conservative: z.array(z.string()),
      donate_liberal: z.array(z.string()),
      donate_political: z.array(z.string()),
      donate_veterans: z.array(z.string()),
      home_purchase_price: numberRangeSchema,
      home_purchase_year: numberRangeSchema,
      home_heat: z.array(z.string()),
      home_swimming_pool: z.array(z.string()),
      home_aircon: z.array(z.string()),
      home_sewer: z.array(z.string()),
      home_water: z.array(z.string()),
      interests_pets: z.array(z.string()),
      interests_cats: z.array(z.string()),
      interests_dogs: z.array(z.string()),
      mortgage_loan_type: z.array(z.string()),
      mortgage_rate_type: z.array(z.string()),
      estimated_home_value: z.array(z.string()),
      mortgage_amount: numberRangeSchema,
      generations_in_household: z.array(z.string()),
      sales_transaction_type: z.array(z.string()),
    }),
    notNulls: z.array(z.string()),
    nullOnly: z.array(z.string()),
  }),
});

export type AudienceFiltersFormValues = z.infer<
  typeof audienceFiltersFormSchema
>;

export type AudienceFiltersFormValue = string[] | NumberRange;

export const audienceFiltersFormDefaultValues = {
  jobId: '',
  segment: [],
  dateRange: {
    startDate: '',
    endDate: '',
  },
  score: [],
  filters: {
    age: {
      minAge: null,
      maxAge: null,
    },
    city: [],
    state: [],
    zip: [],
    gender: [],
    profile: {
      incomeRange: [],
      homeowner: [],
      married: [],
      netWorth: [],
      children: [],
    },
    businessProfile: {
      jobTitle: [],
      seniority: [],
      department: [],
      companyName: [],
      companyDomain: [],
      industry: [],
      sic: [],
      employeeCount: [],
      companyRevenue: [],
      companyNaics: [],
    },
    attributes: {
      credit_rating: [],
      language_code: [],
      occupation_group: [],
      occupation_type: [],
      home_year_built: {
        min: null,
        max: null,
      },
      single_parent: [],
      cra_code: [],
      dwelling_type: [],
      credit_range_new_credit: [],
      ethnic_code: [],
      marital_status: [],
      net_worth: [],
      education: [],
      credit_card_user: [],
      investment: [],
      smoker: [],
      donate_conservative: [],
      donate_liberal: [],
      donate_political: [],
      donate_veterans: [],
      home_purchase_price: {
        min: null,
        max: null,
      },
      home_purchase_year: {
        min: null,
        max: null,
      },
      home_heat: [],
      home_swimming_pool: [],
      home_aircon: [],
      home_sewer: [],
      home_water: [],
      interests_pets: [],
      interests_cats: [],
      interests_dogs: [],
      mortgage_loan_type: [],
      mortgage_rate_type: [],
      estimated_home_value: [],
      mortgage_amount: {
        min: null,
        max: null,
      },
      generations_in_household: [],
      sales_transaction_type: [],
    },
    notNulls: [],
    nullOnly: [],
  },
} satisfies z.infer<typeof audienceFiltersFormSchema>;
