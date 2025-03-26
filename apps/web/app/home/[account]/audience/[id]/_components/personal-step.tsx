import { Path } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormMessage } from '@kit/ui/form';
import { Label } from '@kit/ui/label';
import { Separator } from '@kit/ui/separator';

import { RangeInput } from '~/components/ui/range-input';
import { AudienceFiltersFormValues } from '~/lib/audience/schema/audience-filters-form.schema';

import FilterTable from './filters-table';

export const personalFields = [
  'filters.age',
  'filters.gender',
  'filters.attributes.ethnic_code',
  'filters.attributes.language_code',
  'filters.attributes.education',
  'filters.attributes.smoker',
] as const satisfies readonly Path<AudienceFiltersFormValues>[];

type PersonalFieldWithoutAge = Exclude<
  (typeof personalFields)[number],
  'filters.age'
>;

export default function PersonalStep() {
  const { control } = useFormContext<AudienceFiltersFormValues>();

  return (
    <>
      <FormField
        control={control}
        name="filters.age"
        render={({ field }) => (
          <FormItem className="w-full">
            <Label>Age Range</Label>
            <FormControl>
              <RangeInput
                value={{
                  min: field.value.minAge,
                  max: field.value.maxAge,
                }}
                onChange={(newRange) => {
                  field.onChange({
                    minAge: newRange.min,
                    maxAge: newRange.max,
                  });
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Separator />
      <FilterTable
        fields={personalFields}
        fieldTypeOptions={fieldTypeOptions}
        fieldOptions={fieldOptions}
      />
    </>
  );
}

const fieldTypeOptions: Array<{
  value: PersonalFieldWithoutAge;
  label: string;
}> = [
  {
    value: 'filters.gender',
    label: 'Gender',
  },
  {
    value: 'filters.attributes.ethnic_code',
    label: 'Ethnicity',
  },
  {
    value: 'filters.attributes.language_code',
    label: 'Language',
  },
  {
    value: 'filters.attributes.education',
    label: 'Education',
  },
  {
    value: 'filters.attributes.smoker',
    label: 'Smoker',
  },
];

const fieldOptions: Partial<Record<PersonalFieldWithoutAge, string[]>> = {
  'filters.gender': ['male', 'female', 'unknown'],
  'filters.attributes.ethnic_code': [
    'afghani',
    'bengladesh',
    'indian',
    'pakistani',
    'sri lankan',
    'nepal',
    'telugan',
    'algerian',
    'arab',
    'bahrain',
    'egyptian',
    'greek',
    'iraqi',
    'kurdish',
    'jewish',
    'kuwaiti',
    'libyan',
    'macedonian',
    'moroccan',
    'qatar',
    'persian',
    'saudi',
    'syrian',
    'tunisian',
    'turkish',
    'yemeni',
    'maltese',
    'native american',
    'african american 1',
    'angolan',
    'ashanti',
    'basotho',
    'benin',
    'bhutanese',
    'burkina faso',
    'burundi',
    'cameroon',
    'cent afric rep',
    'chad',
    'comoros',
    'congo',
    'equat guinea',
    'ethiopian',
    'gabon',
    'gambia',
    'ghana',
    'guinea-bissea',
    'guyana',
    'ivory coast',
    'kenya',
    'lesotho',
    'liberian',
    'madagascar',
    'malawi',
    'mali',
    'namibian',
    'nigerian',
    'mozambique',
    'papua new guinea',
    'ruandan',
    'senegalese',
    'siere leone',
    'somalia',
    'danish',
    'dutch',
    'finnish',
    'icelandic',
    'norwegian',
    'scotch',
    'swedish',
    'welsh',
    'aleut',
    'myanmar',
    'chinese',
    'fiji',
    'hawaiian',
    'indonesian',
    'japanese',
    'khmer',
    'korean',
    'laotian',
    'malay',
    'mongolian',
    'other asian',
    'filipino',
    'thai',
    'tibetan',
    'vietnamese',
    'maldivian',
    'nauruan',
    'new zealand',
    'australian',
    'vanuatuan',
    'pili',
    'belgian',
    'basque',
    'english',
    'french',
    'german',
    'irish',
    'italian',
    'portuguese',
    'hispanic',
    'liechtenstein',
    'luxembourgian',
    'swiss',
    'manx',
    'albanian',
    'armenian',
    'austrian',
    'azerb',
    'bosnian',
    'bulgarian',
    'byelorussian',
    'chechnian',
    'croatian',
    'czech',
    'estonian',
    'georgian',
    'hungarian',
    'kazakh',
    'kirghiz',
    'kyrgyzstani',
    'latvian',
    'lithuanian',
    'moldavian',
    'polish',
    'romanian',
    'russian',
    'serbian',
    'slovakian',
    'slovenian',
    'tajikistan',
    'tajik',
    'turkmenistan',
    'ukrainian',
    'uzbekistani',
    'south african',
    'surinam',
    'sudanese',
    'swaziland',
    'tanzanian',
    'togo',
    'tonga',
    'ugandan',
    'xhosa',
    'zaire',
    'zambian',
    'zimbabwe',
    'zulu',
    'djibouti',
    'guinean',
    'mauritania',
    'niger',
    'seychelles',
    'western samoa',
    'african american 2',
    'botswanian',
    'hausa',
    'caribbean african american',
    'swahili',
    'multi-ethnic',
  ],
  'filters.attributes.language_code': [
    'afrikaans',
    'albanian',
    'amharic',
    'arabic',
    'armenian',
    'ashanti',
    'azeri',
    'bantu',
    'basque',
    'bengali',
    'bulgarian',
    'burmese',
    'chinese (mandarin, cantonese and other dialects)',
    'comorian',
    'czech',
    'danish',
    'dutch',
    'dzongha',
    'english',
    'estonian',
    'farsi',
    'finnish',
    'french',
    'georgian',
    'german',
    'ga',
    'greek',
    'hausa',
    'hebrew',
    'hindi',
    'hungarian',
    'icelandic',
    'indonesian',
    'italian',
    'japanese',
    'kazakh',
    'khmer',
    'kirghiz',
    'korean',
    'laotian (include hmong)',
    'latvian',
    'lithuanian',
    'macedonian',
    'malagasy',
    'malay',
    'moldavian',
    'mongolian',
    'nepali',
    'norwegian',
    'oromo',
    'pashto',
    'polish',
    'portuguese',
    'romanian',
    'russian',
    'samoan',
    'serbo-croatian',
    'sinhalese',
    'slovakian',
    'slovenian',
    'somali',
    'sotho',
    'spanish',
    'swahili',
    'swazi',
    'swedish',
    'tagalog',
    'tajik',
    'thai',
    'tibetan',
    'tongan',
    'turkish',
    'turkmeni',
    'tswana',
    'unknown',
    'urdu',
    'uzbeki',
    'vietnamese',
    'xhosa',
    'zulu',
  ],
  'filters.attributes.education': [
    'high school',
    "bachelor's",
    "master's",
    'doctorate',
  ],
  'filters.attributes.smoker': ['smoker', 'non-smoker'],
};
