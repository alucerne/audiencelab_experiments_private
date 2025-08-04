import React, { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Badge } from '@kit/ui/badge';
import { Copy, ExternalLink, Trash2, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { WebhookSegment, createWebhookSegment, getWebhookUrl } from '../utils/createWebhook';

interface WebhookManagerProps {
  accountId: string;
  onWebhookDataChange: (data: any[]) => void;
  onSaveSegment: (segment: WebhookSegment) => void;
}

export default function WebhookManager({ 
  accountId, 
  onWebhookDataChange, 
  onSaveSegment 
}: WebhookManagerProps) {
  const [webhookSegments, setWebhookSegments] = useState<WebhookSegment[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookSegment | null>(null);
  const [webhookData, setWebhookData] = useState<any[]>([]);
  const [segmentName, setSegmentName] = useState('');

  // Poll for new webhook data every 3 seconds
  useEffect(() => {
    if (!selectedWebhook) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/webhook/${selectedWebhook.id}`);
        if (response.ok) {
          const result = await response.json();
          setWebhookData(result.data || []);
          onWebhookDataChange(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching webhook data:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedWebhook, onWebhookDataChange]);

  const handleCreateWebhook = () => {
    const newWebhook = createWebhookSegment(accountId);
    setWebhookSegments(prev => [...prev, newWebhook]);
    setSelectedWebhook(newWebhook);
    setWebhookData([]);
    onWebhookDataChange([]);
    toast.success('Webhook created successfully!');
  };

  const handleCopyWebhookUrl = async (webhookId: string) => {
    const webhookUrl = getWebhookUrl(webhookId, window.location.origin);
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success('Webhook URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy webhook URL');
    }
  };

  const handleDeleteWebhook = (webhookId: string) => {
    setWebhookSegments(prev => prev.filter(w => w.id !== webhookId));
    if (selectedWebhook?.id === webhookId) {
      setSelectedWebhook(null);
      setWebhookData([]);
      onWebhookDataChange([]);
    }
    toast.success('Webhook deleted');
  };

  const handleSaveSegment = () => {
    if (!selectedWebhook || !segmentName.trim()) {
      toast.error('Please provide a segment name');
      return;
    }

    const segmentToSave = {
      ...selectedWebhook,
      name: segmentName,
      data: webhookData
    };

    onSaveSegment(segmentToSave);
    toast.success('Segment saved successfully!');
    setSegmentName('');
  };

  const handleSelectWebhook = (webhook: WebhookSegment) => {
    setSelectedWebhook(webhook);
    // Fetch current data immediately
    fetch(`/api/webhook/${webhook.id}`)
      .then(res => res.json())
      .then(result => {
        setWebhookData(result.data || []);
        onWebhookDataChange(result.data || []);
      })
      .catch(error => {
        console.error('Error fetching webhook data:', error);
        setWebhookData([]);
        onWebhookDataChange([]);
      });
  };

  return (
    <div className="space-y-4">
      {/* Create Webhook Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Webhook Data Sources</h3>
        <Button onClick={handleCreateWebhook} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Webhook
        </Button>
      </div>

      {/* Webhook Segments List */}
      <div className="grid gap-4">
        {webhookSegments.map((webhook) => (
          <Card 
            key={webhook.id} 
            className={`cursor-pointer transition-colors ${
              selectedWebhook?.id === webhook.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSelectWebhook(webhook)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{webhook.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {webhookData.length} records
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyWebhookUrl(webhook.id);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(getWebhookUrl(webhook.id, window.location.origin), '_blank');
                    }}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWebhook(webhook.id);
                    }}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Selected Webhook Details */}
      {selectedWebhook && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">Webhook Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Webhook URL
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={getWebhookUrl(selectedWebhook.id, window.location.origin)}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyWebhookUrl(selectedWebhook.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-600">Records received:</span>
                <span className="ml-2 font-semibold">{webhookData.length}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <span className="ml-2 font-semibold">
                  {new Date(selectedWebhook.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Save as Segment */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Enter segment name..."
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveSegment}
                  disabled={!segmentName.trim() || webhookData.length === 0}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save as Segment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {webhookSegments.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-gray-500 mb-4">
              No webhooks created yet. Create your first webhook to start receiving external data.
            </p>
            <Button onClick={handleCreateWebhook} className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Create Webhook
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 