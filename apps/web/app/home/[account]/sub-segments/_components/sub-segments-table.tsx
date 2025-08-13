'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Eye, Trash2, Calendar, Users } from 'lucide-react';

interface Segment {
  id: string;
  name: string;
  parent_audience_id?: string;
  created_at?: string;
  source_url?: string;
  format?: string;
  filterTree?: any;
  selectedFields?: string[];
}

interface SubSegmentsTableProps {
  segments: Segment[];
  accountId: string;
}

export function SubSegmentsTable({ segments, accountId }: SubSegmentsTableProps) {
  const [loading, setLoading] = React.useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePreview = async (segment: Segment) => {
    try {
      setLoading(true);
      const response = await fetch('/api/studio/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment_id: segment.id, limit: 10 })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Preview: ${data.rows.length} rows from ${segment.name}`);
      } else {
        alert('Failed to preview segment');
      }
    } catch (err) {
      alert('Error previewing segment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (segment: Segment) => {
    if (!confirm(`Are you sure you want to delete "${segment.name}"?`)) {
      return;
    }

    // TODO: Implement segment deletion
    alert('Segment deletion not yet implemented');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sub-segments ({segments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No sub-segments found for this account.
              </p>
              <Button 
                onClick={() => window.location.href = `/home/${accountId}/studio`}
                variant="outline"
              >
                Create Sub-segment in Studio
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {segments.map((segment) => (
                <div key={segment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Sub-segment</Badge>
                    <div>
                      <h3 className="font-medium">{segment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Parent: {segment.parent_audience_id || 'Unknown'} • 
                        Created: {segment.created_at ? formatDate(segment.created_at) : 'Unknown'}
                      </p>
                      {segment.source_url && (
                        <p className="text-xs text-muted-foreground">
                          Source: {segment.format?.toUpperCase()} • {segment.source_url.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(segment)}
                      disabled={loading}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(segment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={() => window.location.href = `/home/${accountId}/studio`}
            className="w-full"
          >
            Create New Sub-segment
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = `/home/${accountId}/studio/audiences`}
            className="w-full"
          >
            View All Studio Audiences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 