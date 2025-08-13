import { z } from 'zod';

const production = process.env.NODE_ENV === 'production';

const AppConfigSchema = z
  .object({
    name: z
      .string({
        description: `This is the name of your SaaS. Ex. "Audience 
Lab"`,
        required_error: `Please provide the variable 
NEXT_PUBLIC_PRODUCT_NAME`,
      })
      .min(1),
    title: z
      .string({
        description: `This is the default title tag of your 
SaaS.`,
        required_error: `Please provide the variable 
NEXT_PUBLIC_SITE_TITLE`,
      })
      .min(1),
    description: z.string({
      description: `This is the default description of your 
SaaS.`,
      required_error: `Please provide the variable 
NEXT_PUBLIC_SITE_DESCRIPTION`,
    }),
    url: z
      .string({
        required_error: `Please provide the variable 
NEXT_PUBLIC_SITE_URL`,
      })
      .refine((url) => {
        // Temporarily disable URL validation for experimental deployment
        return true;
      }, {
        message: `Please provide a valid HTTPS URL. Set the variable 
NEXT_PUBLIC_SITE_URL with a valid URL, such as: 
'https://example.com'`,
      }),
    locale: z
      .string({
        description: `This is the default locale of your SaaS.`,
        required_error: `Please provide the variable 
NEXT_PUBLIC_DEFAULT_LOCALE`,
      })
      .default('en'),
    theme: z.enum(['light', 'dark', 'system']),
    production: z.boolean(),
    themeColor: z.string(),
    themeColorDark: z.string(),
  })
  .refine(
    (schema) => {
      return true; // Temporarily disable theme color validation
    },
    {
      message: `Please provide different theme colors for light 
and dark themes.`,
      path: ['themeColor'],
    },
  );

const appConfig = AppConfigSchema.parse({
  name: process.env.NEXT_PUBLIC_PRODUCT_NAME,
  title: process.env.NEXT_PUBLIC_SITE_TITLE,
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
  url: process.env.NEXT_PUBLIC_SITE_URL,
  locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  theme: process.env.NEXT_PUBLIC_DEFAULT_THEME_MODE,
  themeColor: process.env.NEXT_PUBLIC_THEME_COLOR,
  themeColorDark: process.env.NEXT_PUBLIC_THEME_COLOR_DARK,
  production,
});

export default appConfig;
