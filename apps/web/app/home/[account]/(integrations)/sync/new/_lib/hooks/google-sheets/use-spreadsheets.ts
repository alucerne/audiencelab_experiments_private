import { useIntegrationApp } from '@integration-app/react';
import { useQuery } from '@tanstack/react-query';

interface SpreadsheetRecord {
  id: string;
  name: string;
}

interface useSpreadsheetsOptions {
  enabled?: boolean;
}

export function useSpreadsheets({
  enabled = true,
}: useSpreadsheetsOptions = {}) {
  const integrationApp = useIntegrationApp();

  const query = useQuery({
    queryKey: ['google-sheets-spreadsheets'],
    queryFn: async () => {
      let cursor: string | undefined = undefined;
      const allSheets: SpreadsheetRecord[] = [];

      do {
        const res = await integrationApp
          .connection('google-sheets')
          .action('list-data-records')
          .run({ cursor });

        const { records, cursor: nextCursor } = res.output;
        allSheets.push(...(records as SpreadsheetRecord[]));
        cursor = nextCursor;
      } while (cursor);

      return allSheets;
    },
    enabled,
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  return {
    spreadsheets: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
