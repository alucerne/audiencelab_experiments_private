// utils/createWebhook.ts

export interface WebhookSegment {
  id: string;
  name: string;
  data: any[];
  createdAt: string;
  source: 'webhook';
  accountId: string;
}

export function generateWebhookId(): string {
  // Generate a unique webhook ID
  return Math.random().toString(36).substring(2, 10) + 
         Date.now().toString(36);
}

export function createWebhookSegment(accountId: string): WebhookSegment {
  return {
    id: generateWebhookId(),
    name: `Webhook Segment - ${new Date().toLocaleString()}`,
    data: [],
    createdAt: new Date().toISOString(),
    source: 'webhook',
    accountId
  };
}

export function getWebhookUrl(webhookId: string, baseUrl: string): string {
  return `${baseUrl}/api/webhook/${webhookId}`;
} 