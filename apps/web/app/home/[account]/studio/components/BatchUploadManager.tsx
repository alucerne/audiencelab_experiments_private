import React, { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Badge } from '@kit/ui/badge';
import { Copy, ExternalLink, Trash2, Save, Plus, Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface BatchUpload {
  upload_id: string;
  upload_name: string;
  records: any[];
  fields: string[];
  created_at: string;
  rows_received: number;
  status: string;
}

interface BatchUploadManagerProps {
  accountId: string;
  onBatchUploadDataChange: (data: any[], uploadId?: string) => void;
  onSaveSegment: (segment: any) => void;
}

export default function BatchUploadManager({ 
  accountId, 
  onBatchUploadDataChange, 
  onSaveSegment
}: BatchUploadManagerProps) {
  const [batchUploads, setBatchUploads] = useState<BatchUpload[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<BatchUpload | null>(null);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [segmentName, setSegmentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's batch uploads
  useEffect(() => {
    fetchBatchUploads();
  }, []);

  const fetchBatchUploads = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/audience/batch-upload');
      if (response.ok) {
        const result = await response.json();
        setBatchUploads(result.uploads || []);
      }
    } catch (error) {
      console.error('Error fetching batch uploads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUpload = async (upload: BatchUpload) => {
    console.log('Selecting batch upload:', upload.upload_id);
    setSelectedUpload(upload);
    
    try {
      const response = await fetch(`/api/audience/batch-upload/${upload.upload_id}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Batch upload data fetch:', {
          uploadId: upload.upload_id,
          dataCount: result.rows_received,
          dataLength: result.records?.length || 0,
          sampleData: result.records?.[0]
        });
        
        setUploadData(result.records || []);
        onBatchUploadDataChange(result.records || [], upload.upload_id);
      }
    } catch (error) {
      console.error('Error fetching batch upload data:', error);
      setUploadData([]);
      onBatchUploadDataChange([]);
    }
  };

  const handleRefreshUploadData = async () => {
    if (!selectedUpload) return;
    
    try {
      setIsLoading(true);
      console.log('Manual refresh for batch upload:', selectedUpload.upload_id);
      const response = await fetch(`/api/audience/batch-upload/${selectedUpload.upload_id}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Manual refresh result:', {
          uploadId: selectedUpload.upload_id,
          dataCount: result.rows_received,
          dataLength: result.records?.length || 0,
          sampleData: result.records?.[0]
        });
        
        setUploadData(result.records || []);
        onBatchUploadDataChange(result.records || [], selectedUpload.upload_id);
        toast.success(`Refreshed: ${result.rows_received} records`);
      }
    } catch (error) {
      console.error('Error refreshing batch upload data:', error);
      toast.error('Failed to refresh batch upload data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUpload = async (uploadId: string) => {
    try {
      const response = await fetch(`/api/audience/batch-upload/${uploadId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setBatchUploads(prev => prev.filter(u => u.upload_id !== uploadId));
        if (selectedUpload?.upload_id === uploadId) {
          setSelectedUpload(null);
          setUploadData([]);
          onBatchUploadDataChange([]);
        }
        toast.success('Batch upload deleted');
      }
    } catch (error) {
      console.error('Error deleting batch upload:', error);
      toast.error('Failed to delete batch upload');
    }
  };

  const handleSaveSegment = () => {
    if (!selectedUpload || !segmentName.trim()) {
      toast.error('Please provide a segment name');
      return;
    }

    const segmentToSave = {
      id: selectedUpload.upload_id,
      name: segmentName,
      data: uploadData,
      type: 'batch_upload',
      created_at: selectedUpload.created_at
    };

    onSaveSegment(segmentToSave);
    toast.success('Segment saved successfully!');
    setSegmentName('');
  };

  const handleCopyUploadId = async (uploadId: string) => {
    try {
      await navigator.clipboard.writeText(uploadId);
      toast.success('Upload ID copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy upload ID');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Batch Upload Data Sources</h3>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchBatchUploads} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Batch Uploads List */}
      <div className="grid gap-4">
        {batchUploads.map((upload) => (
          <Card 
            key={upload.upload_id} 
            className={`cursor-pointer transition-colors ${
              selectedUpload?.upload_id === upload.upload_id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSelectUpload(upload)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{upload.upload_name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {upload.rows_received} records
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {upload.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUploadId(upload.upload_id);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy ID
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUpload(upload.upload_id);
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

      {/* Selected Upload Details */}
      {selectedUpload && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">Batch Upload Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Upload ID
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={selectedUpload.upload_id}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyUploadId(selectedUpload.upload_id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-600">Records:</span>
                <span className="ml-2 font-semibold">{uploadData.length}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <span className="ml-2 font-semibold">
                  {new Date(selectedUpload.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <span className="ml-2 font-semibold">{selectedUpload.status}</span>
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-600">Available Fields:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedUpload.fields.map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Manual Refresh */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshUploadData}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
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
                  disabled={!segmentName.trim() || uploadData.length === 0}
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

      {/* Empty State */}
      {batchUploads.length === 0 && !isLoading && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="text-center py-8">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Batch Uploads</h3>
            <p className="text-gray-500 mb-4">
              Use the API endpoint to upload batch data for processing and enrichment.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">API Endpoint:</p>
              <code className="text-xs bg-white p-2 rounded border block">
                POST /api/audience/batch-upload
              </code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 