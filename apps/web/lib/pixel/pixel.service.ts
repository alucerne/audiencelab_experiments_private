import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import miscConfig from '~/config/misc.config';
import { Database } from '~/lib/database.types';

export function createPixelService(client: SupabaseClient<Database>) {
  return new PixelService(client);
}

class PixelService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getPixels(params: { accountId: string }) {
    const { data, error } = await this.client
      .from('pixel')
      .select('*')
      .eq('account_id', params.accountId)
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }
}
