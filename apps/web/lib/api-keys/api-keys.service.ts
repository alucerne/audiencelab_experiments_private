import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '../database.types';

export function createApiKeysService(client: SupabaseClient<Database>) {
  return new ApiKeysService(client);
}

class ApiKeysService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async createApiKey({
    accountId,
    name,
    scopes,
    expiresAt,
  }: {
    accountId: string;
    name: string;
    scopes: Array<{ entityType: string; entityId?: string; action: string }>;
    expiresAt?: Date;
  }) {
    // Format scopes for storage
    const formattedScopes = scopes.map((scope) => ({
      entity_type: scope.entityType,
      entity_id: scope.entityId || '*',
      action: scope.action,
    }));

    // Call our database function to create the API key
    const { data, error } = await this.client.rpc('create_api_key', {
      p_account_id: accountId,
      p_name: name,
      p_scopes: formattedScopes,
      p_expires_at: expiresAt ? expiresAt.toISOString() : undefined,
    });

    if (error) {
      throw error;
    }

    return data;
  }
}
