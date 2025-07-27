import { useIntegrationApp } from '@integration-app/react';
import { useQuery } from '@tanstack/react-query';

interface SheetTabRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface UseSheetTabsOptions {
  enabled?: boolean;
  spreadsheetId?: string;
}

export function useSheetTabs({
  enabled = true,
  spreadsheetId,
}: UseSheetTabsOptions = {}) {
  const integrationApp = useIntegrationApp();

  const query = useQuery({
    queryKey: ['google-sheets-tabs', spreadsheetId],
    queryFn: async () => {
      if (!spreadsheetId) {
        throw new Error('Spreadsheet ID is required to fetch sheet tabs');
      }
      const res = await integrationApp
        .connection('google-sheets')
        .action('list-spreadsheet-tabs')
        .run({ spreadsheetId });

      return res.output.records as SheetTabRecord[];
    },
    enabled: enabled && Boolean(spreadsheetId),
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  return {
    sheetTabs: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
