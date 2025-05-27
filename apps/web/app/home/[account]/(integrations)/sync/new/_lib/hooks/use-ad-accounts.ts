import { useIntegrationApp } from '@integration-app/react';
import { useQuery } from '@tanstack/react-query';

interface AdAccountRecord {
  id: string;
  name: string;
  accountId: string;
}

interface UseAdAccountsOptions {
  enabled?: boolean;
}

export function useAdAccounts({ enabled = true }: UseAdAccountsOptions = {}) {
  const integrationApp = useIntegrationApp();

  const query = useQuery({
    queryKey: ['facebook-ad-accounts'],
    queryFn: async () => {
      let cursor: string | undefined = undefined;
      const allAccounts: AdAccountRecord[] = [];

      do {
        const res = await integrationApp
          .connection('facebook-ads')
          .action('list-ad-accounts')
          .run({ cursor });

        const { records, cursor: nextCursor } = res.output;
        allAccounts.push(...(records as AdAccountRecord[]));
        cursor = nextCursor;
      } while (cursor);

      return allAccounts;
    },
    enabled,
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  return {
    adAccounts: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
