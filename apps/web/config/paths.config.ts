import { z } from 'zod';

const PathsSchema = z.object({
  auth: z.object({
    signIn: z.string().min(1),
    signUp: z.string().min(1),
    verifyMfa: z.string().min(1),
    callback: z.string().min(1),
    passwordReset: z.string().min(1),
    passwordUpdate: z.string().min(1),
  }),
  app: z.object({
    home: z.string().min(1),
    personalAccountSettings: z.string().min(1),
    personalAccountBilling: z.string().min(1),
    personalAccountBillingReturn: z.string().min(1),
    accountHome: z.string().min(1),
    accountEnrichment: z.string().min(1),
    accountEnrichmentUpload: z.string().min(1),
    accountPixel: z.string().min(1),
    accountSync: z.string().min(1),
    accountSyncNew: z.string().min(1),
    accountWhiteLabel: z.string().min(1),
    accountWhiteLabelTeams: z.string().min(1),
    accountWhiteLabelBranding: z.string().min(1),
    accountWhiteLabelSignupLinks: z.string().min(1),
    accountSettings: z.string().min(1),
    accountUsage: z.string().min(1),
    accountBilling: z.string().min(1),
    accountMembers: z.string().min(1),
    accountBillingReturn: z.string().min(1),
    joinTeam: z.string().min(1),
  }),
});

const pathsConfig = PathsSchema.parse({
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    verifyMfa: '/auth/verify',
    callback: '/auth/callback',
    passwordReset: '/auth/password-reset',
    passwordUpdate: '/update-password',
  },
  app: {
    home: '/home',
    personalAccountSettings: '/home/settings',
    personalAccountBilling: '/home/billing',
    personalAccountBillingReturn: '/home/billing/return',
    accountHome: '/home/[account]',
    accountEnrichment: '/home/[account]/enrichment',
    accountEnrichmentUpload: '/home/[account]/enrichment/upload',
    accountPixel: '/home/[account]/pixel',
    accountSync: '/home/[account]/sync',
    accountSyncNew: '/home/[account]/sync/new',
    accountWhiteLabel: '/home/[account]/white-label',
    accountWhiteLabelTeams: '/home/[account]/white-label/teams',
    accountWhiteLabelBranding: '/home/[account]/white-label/branding',
    accountWhiteLabelSignupLinks: '/home/[account]/white-label/signup-links',
    accountSettings: `/home/[account]/settings`,
    accountUsage: `/home/[account]/usage`,
    accountBilling: `/home/[account]/billing`,
    accountMembers: `/home/[account]/members`,
    accountBillingReturn: `/home/[account]/billing/return`,
    joinTeam: '/join',
  },
} satisfies z.infer<typeof PathsSchema>);

export default pathsConfig;
