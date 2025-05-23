'use client';

import { useIntegrations } from '@integration-app/react';
import { useIntegrationApp } from '@integration-app/react';
import type { Integration as IntegrationAppIntegration } from '@integration-app/sdk';
import { AlertCircle, Loader2, RefreshCcw } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';

import { NewSyncFormSchema } from '~/lib/integration-app/schema/new-sync-form.schema';

export default function IntegrationStep({
  onConnect,
}: {
  onConnect: () => void;
}) {
  const {
    integrations,
    refresh,
    loading: integrationsIsLoading,
    error,
  } = useIntegrations({
    search: 'facebook-ads',
  });

  return (
    <div>
      {integrationsIsLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="mb-2 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Loading integrations...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="text-destructive mb-2 h-8 w-8" />
          <p className="text-muted-foreground mb-4 text-sm">
            {error.message || 'Failed to load integrations'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <IntegrationListItem
              key={integration.key}
              integration={integration}
              onRefresh={refresh}
              onConnect={onConnect}
            />
          ))}
          <div className="flex items-center justify-center rounded-lg border p-4">
            <div className="text-muted-foreground text-sm">
              More integrations coming soon...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function IntegrationListItem({
  integration,
  onRefresh,
  onConnect,
}: {
  integration: IntegrationAppIntegration;
  onRefresh: () => void;
  onConnect: () => void;
}) {
  const { setValue } = useFormContext<z.infer<typeof NewSyncFormSchema>>();

  const integrationApp = useIntegrationApp();

  async function handleConnect() {
    try {
      const connection = await integrationApp
        .integration(integration.key)
        .openNewConnection();

      if (!connection.id) {
        toast.error('Please select a connection first');
        return;
      }

      setValue('integration.integrationKey', integration.key, {
        shouldDirty: true,
        shouldValidate: true,
      });
      onConnect();
      onRefresh();
    } catch (error) {
      console.error('Failed to connect:', error);
      toast.error('Failed to connect integration');
    }
  }

  async function handleDisconnect() {
    if (!integration.connection?.id) return;
    try {
      await integrationApp.connection(integration.connection.id).archive();
      onRefresh();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect integration');
    }
  }

  const isConnected = !!integration.connection;

  return (
    <li
      onClick={() => {
        if (!isConnected) {
          handleConnect();
        } else {
          setValue('integration.integrationKey', integration.key, {
            shouldDirty: true,
            shouldValidate: true,
          });
          onConnect();
        }
      }}
      className="group flex cursor-pointer items-center space-x-4 rounded-lg border p-4"
    >
      <div className="flex-shrink-0">
        {integration.logoUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={integration.logoUri}
            alt={`${integration.name} logo`}
            className="h-10 w-10 rounded-lg"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-lg text-lg font-medium">
            {integration.name[0]}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-medium">{integration.name}</h3>
      </div>
      <div className="flex space-x-2">
        {isConnected && (
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDisconnect();
            }}
          >
            Disconnect
          </Button>
        )}
      </div>
    </li>
  );
}
