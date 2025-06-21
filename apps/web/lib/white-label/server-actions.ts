'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { CreditsFormSchema } from './schema/credits-form.schema';
import { SignupLinkFormSchema } from './schema/signup-link-form.schema';
import { createWhiteLabelService } from './white-label.service';

export const updateWhiteLabelCompanyNameAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createWhiteLabelService(client);

    await service.updateCompanyName(data);

    revalidatePath('/home/[account]/white-label/branding', 'page');
  },
  {
    schema: z.object({
      accountId: z.string(),
      name: z.string(),
    }),
  },
);

export const updateWhiteLabelDomainAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createWhiteLabelService(client);

    await service.updateDomain(data);

    revalidatePath('/home/[account]/white-label/branding', 'page');
  },
  {
    schema: z.object({
      accountId: z.string(),
      domain: z.string(),
    }),
  },
);

export const verifyWhiteLabelDomainAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createWhiteLabelService(client);

    const verified = await service.verifyDomain(data);

    revalidatePath('/home/[account]/white-label/branding', 'page');

    return verified;
  },
  {
    schema: z.object({
      accountId: z.string(),
      domain: z.string(),
    }),
  },
);

export const updateWhiteLabelLogoAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createWhiteLabelService(client);

    await service.updateLogo(data);

    revalidatePath('/home/[account]/white-label/branding', 'page');
  },
  {
    schema: z.object({
      accountId: z.string(),
      logoUrl: z.string(),
    }),
  },
);

export const updateWhiteLabelIconAction = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createWhiteLabelService(client);

    await service.updateIcon(data);

    revalidatePath('/home/[account]/white-label/branding', 'page');
  },
  {
    schema: z.object({
      accountId: z.string(),
      iconUrl: z.string(),
    }),
  },
);
