'use client';

import React, { useState, useEffect } from 'react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { X, Save, Tag, FileText } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Textarea } from '@kit/ui/textarea';
import { Label } from '@kit/ui/label';
import { Badge } from '@kit/ui/badge';

import { createSegmentAction, generateSegmentNameAction } from '~/lib/segments/server-actions';
import { CustomColumn } from '../utils/fieldOptions';
import { EnrichFieldKey } from '../utils/enrichmentOptions';

interface Filter {
  id: string;
  group: "pixel_event" | "contact";
  field: string;
  operator: string;
  value: string;
}

interface SaveSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (segmentId: string) => void;
  dataSource: 'audience' | 'webhook' | 'batch_upload';
  sourceId: string;
  sourceName?: string;
  filters: Filter[];
  enrichmentFields: EnrichFieldKey[];
  customColumns: CustomColumn[];
  recordCount: number;
  accountId: string;
}

export default function SaveSegmentModal({
  isOpen,
  onClose,
  onSuccess,
  dataSource,
  sourceId,
  sourceName,
  filters,
  enrichmentFields,
  customColumns,
  recordCount,
  accountId,
}: SaveSegmentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Generate default segment name when modal opens
  useEffect(() => {
    if (isOpen && !name) {
      generateDefaultName();
    }
  }, [isOpen, name]);

  const generateDefaultName = async () => {
    try {
      const sourceType = dataSource === 'audience' ? 'audience' : 
                        dataSource === 'webhook' ? 'webhook_upload' : 
                        'batch_upload';
      const result = await generateSegmentNameAction({
        sourceType,
        sourceId,
        baseName: sourceName,
      });

      if (result.success && result.name) {
        setName(result.name);
      } else {
        // Fallback to manual naming if no name returned
        const timestamp = new Date().toLocaleDateString();
        setName(`Studio Segment (${timestamp})`);
      }
    } catch (error) {
      console.error('Failed to generate segment name:', error);
      // Fallback to manual naming
      const timestamp = new Date().toLocaleDateString();
      setName(`Studio Segment (${timestamp})`);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Segment name is required');
      return;
    }

    startTransition(async () => {
      try {
        const sourceType = dataSource === 'audience' ? 'audience' : 'webhook_upload';
        
        const result = await createSegmentAction({
          accountId,
          name: name.trim(),
          description: description.trim() || undefined,
          sourceType,
          sourceId,
          filters,
          enrichmentFields,
          customColumns,
          tags,
        });

        if (result.success) {
          toast.success(`Segment "${name}" saved successfully!`);
          onSuccess?.(result.segmentId);
          onClose();
          
          // Reset form
          setName('');
          setDescription('');
          setTags([]);
        }
      } catch (error) {
        console.error('Failed to save segment:', error);
        toast.error('Failed to save segment. Please try again.');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Save className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold">Save Segment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Segment Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Segment Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <span className="font-medium">Source:</span> {dataSource === 'audience' ? 'Audience Data' : 'Webhook Data'}
              </div>
              <div>
                <span className="font-medium">Records:</span> {recordCount.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Filters:</span> {filters.length}
              </div>
              <div>
                <span className="font-medium">Enrichment Fields:</span> {enrichmentFields.length}
              </div>
              <div>
                <span className="font-medium">Custom Fields:</span> {customColumns.length}
              </div>
            </div>
          </div>

          {/* Segment Name */}
          <div>
            <Label htmlFor="segment-name" className="text-sm font-medium">
              Segment Name *
            </Label>
            <Input
              id="segment-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter segment name"
              className="mt-1"
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="segment-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="segment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of this segment"
              className="mt-1"
              rows={3}
              disabled={isPending}
            />
          </div>

          {/* Tags */}
          <div>
            <Label className="text-sm font-medium">Tags</Label>
            <div className="mt-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag"
                  className="flex-1"
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={isPending || !newTag.trim()}
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                        disabled={isPending}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filters Preview */}
          {filters.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Applied Filters</Label>
              <div className="mt-1 space-y-1">
                {filters.map((filter, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {filter.field} {filter.operator} "{filter.value}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enrichment Fields Preview */}
          {enrichmentFields.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Enrichment Fields</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {enrichmentFields.map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields Preview */}
          {customColumns.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Custom Fields</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {customColumns.map((col) => (
                  <Badge key={col.field} variant="outline" className="text-xs">
                    {col.headerName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            className="flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Segment
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 