import { useIntegrationApp } from '@integration-app/react';
import { useQuery } from '@tanstack/react-query';

interface AudienceRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface UseAudiencesOptions {
  enabled?: boolean;
  fbAdAccountId?: string;
}

export function useAudiences({
  enabled = true,
  fbAdAccountId,
}: UseAudiencesOptions = {}) {
  const integrationApp = useIntegrationApp();

  const query = useQuery({
    queryKey: ['facebook-audiences', fbAdAccountId],
    queryFn: async () => {
      if (!fbAdAccountId) {
        throw new Error('Ad Account ID is required to fetch audiences');
      }
      const res = await integrationApp
        .connection('facebook-ads')
        .action('list-custom-audiences')
        .run({ fbAdAccountId });

      return res.output.records as AudienceRecord[];
    },
    enabled: enabled && Boolean(fbAdAccountId),
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  return {
    audiences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
