'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Eye, Download, Trash2, Calendar, Users } from 'lucide-react';

interface AudienceItem {
  id: string;
  name: string;
  kind: 'pixel' | 'audience' | 'segment';
  parent_audience_id?: string;
  created_at?: string;
  url?: string;
  format?: string;
}

export default function StudioAudiencesPage() {
  const [audiences, setAudiences] = React.useState<AudienceItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load audiences on mount
  React.useEffect(() => {
    loadAudiences();
  }, []);

  const loadAudiences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/studio/audiences/list');
      const data = await response.json();
      
      if (response.ok) {
        setAudiences(data.items || []);
      } else {
        setError(data.error || 'Failed to load audiences');
      }
    } catch (err) {
      setError('Network error loading audiences');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getKindBadge = (kind: string) => {
    switch (kind) {
      case 'pixel':
        return <Badge variant="secondary">Pixel Data</Badge>;
      case 'audience':
        return <Badge variant="default">Audience</Badge>;
      case 'segment':
        return <Badge variant="outline">Saved Segment</Badge>;
      default:
        return <Badge variant="outline">{kind}</Badge>;
    }
  };

  const handlePreview = async (audience: AudienceItem) => {
    if (audience.kind === 'segment') {
      // For segments, we can preview them
      try {
        const response = await fetch('/api/studio/segments/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segment_id: audience.id, limit: 10 })
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`Preview: ${data.rows.length} rows from ${audience.name}`);
        } else {
          alert('Failed to preview segment');
        }
      } catch (err) {
        alert('Error previewing segment');
      }
    } else {
      // For base audiences, redirect to studio
      window.location.href = `/home/test/studio?audience=${audience.id}`;
    }
  };

  const handleDelete = async (audience: AudienceItem) => {
    if (audience.kind !== 'segment') {
      alert('Base audiences cannot be deleted');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${audience.name}"?`)) {
      return;
    }

    // TODO: Implement segment deletion
    alert('Segment deletion not yet implemented');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading audiences...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">Error: {error}</div>
        <Button onClick={loadAudiences} className="mt-4">Retry</Button>
      </div>
    );
  }

  const baseAudiences = audiences.filter(a => a.kind !== 'segment');
  const segments = audiences.filter(a => a.kind === 'segment');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Studio Audiences</h1>
        <Button onClick={() => window.location.href = '/home/test/studio'}>
          Back to Studio
        </Button>
      </div>

      {/* Base Audiences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Base Audiences ({baseAudiences.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {baseAudiences.length === 0 ? (
            <p className="text-muted-foreground">No base audiences available.</p>
          ) : (
            <div className="space-y-3">
              {baseAudiences.map((audience) => (
                <div key={audience.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getKindBadge(audience.kind)}
                    <div>
                      <h3 className="font-medium">{audience.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {audience.url ? `${audience.format?.toUpperCase()} • ${audience.url.substring(0, 50)}...` : 'No URL'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(audience)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Open in Studio
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Saved Segments ({segments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <p className="text-muted-foreground">
              No saved segments yet. Create segments in the Studio to see them here.
            </p>
          ) : (
            <div className="space-y-3">
              {segments.map((segment) => (
                <div key={segment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getKindBadge(segment.kind)}
                    <div>
                      <h3 className="font-medium">{segment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Parent: {segment.parent_audience_id} • Created: {segment.created_at ? formatDate(segment.created_at) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(segment)}
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
            onClick={() => window.location.href = '/home/test/studio'}
            className="w-full"
          >
            Create New Segment
          </Button>
          <Button 
            variant="outline"
            onClick={loadAudiences}
            className="w-full"
          >
            Refresh List
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 