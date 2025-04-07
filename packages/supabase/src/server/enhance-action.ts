import 'server-only';

import { redirect } from 'next/navigation';

import type { User } from '@supabase/supabase-js';

import { ZodType, z } from 'zod';

import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export const zodParseFactory =
  <T extends z.ZodTypeAny>(schema: T) =>
  (data: unknown): z.infer<T> => {
    try {
      return schema.parse(data) as unknown;
    } catch (err) {
      console.error(err);

      // handle error
      throw new Error(`Invalid data: ${err as string}`);
    }
  };

/**
 * @name enhanceAction
 * @description Enhance an action with captcha, schema and auth checks
 */
export function enhanceAction<
  Args,
  Response,
  Config extends {
    auth?: boolean;
    schema?: z.ZodType<Args, z.ZodTypeDef>;
  },
>(
  fn: (
    params: Config['schema'] extends ZodType ? z.infer<Config['schema']> : Args,
    user: Config['auth'] extends false ? undefined : User,
  ) => Response | Promise<Response>,
  config: Config,
) {
  return async (
    params: Config['schema'] extends ZodType ? z.infer<Config['schema']> : Args,
  ) => {
    type UserParam = Config['auth'] extends false ? undefined : User;

    const requireAuth = config.auth ?? true;
    let user: UserParam = undefined as UserParam;

    // validate the schema passed in the config if it exists
    const data = config.schema
      ? zodParseFactory(config.schema)(params)
      : params;

    // verify the user is authenticated if required
    if (requireAuth) {
      // verify the user is authenticated if required
      const auth = await requireUser(getSupabaseServerClient());

      // If the user is not authenticated, redirect to the specified URL.
      if (!auth.data) {
        redirect(auth.redirectTo);
      }

      user = auth.data as UserParam;
    }

    return fn(data, user);
  };
}
