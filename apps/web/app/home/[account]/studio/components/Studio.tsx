'use client';

import React, { useState, useEffect } from 'react';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { Button } from '@kit/ui/button';
import { Play, Loader2, Plus, Code, X, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import Table from './Table';
import Filters from './Filters';
import WebhookManager from './WebhookManager';
import { FIELD_TYPES, CustomColumn } from '../utils/fieldOptions';
import { WebhookSegment } from '../utils/createWebhook';

interface Filter {
  id: string;
  category: string;
  field: string;
  operator: string;
  value: string;
}

interface Audience {
  id: string;
  name: string;
  created_at: string;
  account_id: string;
}

export default function Studio() {
  const { account } = useTeamAccountWorkspace();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string>('');
  const [loadingAudiences, setLoadingAudiences] = useState(true);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());
  const [selectKey, setSelectKey] = useState(0);
  const [codeEditorVisible, setCodeEditorVisible] = useState(false);
  const [codeField, setCodeField] = useState<{ field: string; code: string; sourceField: string } | null>(null);
  const [dataSource, setDataSource] = useState<'audience' | 'webhook'>('audience');
  const [webhookData, setWebhookData] = useState<any[]>([]);

  // Fetch user's audiences
  useEffect(() => {
    async function fetchAudiences() {
      if (!account?.id) return;
      
      try {
        setLoadingAudiences(true);
        const response = await fetch(`/api/audiences?accountId=${account.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch audiences');
        }
        
        const data = await response.json();
        setAudiences(data.audiences || []);
        
        // Auto-select the first audience if available
        if (data.audiences && data.audiences.length > 0) {
          setSelectedAudienceId(data.audiences[0].id);
        }
      } catch (error) {
        console.error('Error fetching audiences:', error);
        setError('Failed to load audiences');
      } finally {
        setLoadingAudiences(false);
      }
    }

    fetchAudiences();
  }, [account?.id]);

  async function fetchPreview(filters: Filter[]) {
    if (!selectedAudienceId) {
      setError('Please select an audience first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/preview-subsegment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: account?.id || '',
          audience_id: selectedAudienceId,
          filters,
          page: 1,
          limit: 100,
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setPreviewRows(data.rows || []);
    } catch (err) {
      console.error('Error fetching preview:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const handleFiltersChange = (newFilters: Filter[]) => {
    setFilters(newFilters);
  };

  const handlePreviewClick = () => {
    fetchPreview(filters);
  };

  const handleAddField = (field: CustomColumn) => {
    setCustomColumns(prev => [...prev, field]);
  };

  const handleDeleteField = (fieldToDelete: string) => {
    // If it's a custom field, remove it from customColumns
    if (fieldToDelete.startsWith('custom_') || fieldToDelete.startsWith('code_')) {
      setCustomColumns(prev => prev.filter(col => col.field !== fieldToDelete));
    } else {
      // For base fields, add them to hidden fields
      setHiddenFields(prev => new Set([...prev, fieldToDelete]));
    }
  };

  const handleAddCodeField = () => {
    const codeFields = customColumns.filter(col => col.type === 'code');
    const fieldId = `code_${codeFields.length}`;
    const newColumn: CustomColumn = {
      field: fieldId,
      headerName: `Code Transform ${codeFields.length + 1}`,
      type: 'code',
      transform: '',
      sourceField: 'domain' // default source field
    };
    
    setCustomColumns(prev => [...prev, newColumn]);
    setCodeField({ field: fieldId, code: '', sourceField: 'domain' });
    setCodeEditorVisible(true);
  };

  const selectedAudience = audiences.find(aud => aud.id === selectedAudienceId);

  const handleWebhookDataChange = (data: any[]) => {
    setWebhookData(data);
    setPreviewRows(data);
  };

  const handleSaveWebhookSegment = (segment: WebhookSegment) => {
    // In a real implementation, save to database
    console.log('Saving webhook segment:', segment);
    
    // Validate segment data
    if (!segment.name || segment.name.trim() === '') {
      toast.error('Segment name is required');
      return;
    }
    
    if (!segment.data || segment.data.length === 0) {
      toast.error('No data to save');
      return;
    }
    
    // Show preview of what will be saved
    const fields = segment.data.length > 0 ? Object.keys(segment.data[0]).filter(f => !f.startsWith('_webhook_')) : [];
    
    toast.success(`Segment "${segment.name}" saved successfully with ${segment.data.length} records!`, {
      description: `Fields: ${fields.join(', ')}`
    });
    
    // Log the segment data for debugging
    console.log('Segment data:', {
      name: segment.name,
      recordCount: segment.data.length,
      fields: fields,
      sampleRecord: segment.data[0]
    });
    
    // TODO: In production, save to database
    // await saveSegmentToDatabase(segment);
  };

  return (
    <div>
      {/* Data Source Selector */}
      <div className="bg-white p-4 border rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Data Source</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={dataSource === 'audience' ? 'default' : 'outline'}
              onClick={() => setDataSource('audience')}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Audience Data
            </Button>
            <Button
              variant={dataSource === 'webhook' ? 'default' : 'outline'}
              onClick={() => setDataSource('webhook')}
              className="flex items-center gap-2"
            >
              <Webhook className="h-4 w-4" />
              Webhook Data
            </Button>
          </div>
        </div>

        {dataSource === 'audience' ? (
          /* Audience Selector */
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Select Audience
              </label>
              <Select 
                value={selectedAudienceId} 
                onValueChange={setSelectedAudienceId}
                disabled={loadingAudiences}
              >
                <SelectTrigger className="w-80">
                  <SelectValue placeholder={
                    loadingAudiences ? 'Loading audiences...' : 'Choose an audience'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {loadingAudiences ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading audiences...
                      </div>
                    </SelectItem>
                  ) : audiences.length > 0 ? (
                    audiences.map((audience) => (
                      <SelectItem key={audience.id} value={audience.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{audience.name}</span>
                          <span className="text-xs text-gray-500">
                            Created {new Date(audience.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-audiences" disabled>
                      No audiences found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedAudience && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Selected:</span> {selectedAudience.name}
              </div>
            )}
          </div>
          
          <Button 
            onClick={handlePreviewClick}
            disabled={loading || filters.length === 0 || !selectedAudienceId}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {loading ? 'Loading Preview...' : 'Preview Sub-Segment'}
          </Button>
        </div>
        ) : (
          /* Webhook Manager */
          <WebhookManager
            accountId={account?.id || ''}
            onWebhookDataChange={handleWebhookDataChange}
            onSaveSegment={handleSaveWebhookSegment}
          />
        )}
      </div>

      {/* Filters - Only show for audience data */}
      {dataSource === 'audience' && (
        <>
          <Filters onChange={handleFiltersChange} />
          
          <div className="mt-4 flex items-center gap-4">
            {filters.length > 0 && (
              <span className="text-sm text-gray-600">
                {filters.length} filter{filters.length !== 1 ? 's' : ''} applied
              </span>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">Error: {error}</p>
        </div>
      )}

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {dataSource === 'audience' ? 'Sub-Segment Table' : 'Webhook Data Table'}
          </h2>
          <div className="flex items-center gap-2">
            <Select 
              key={selectKey}
              onValueChange={(value) => {
                if (value && value !== 'placeholder') {
                  if (value === 'code') {
                    handleAddCodeField();
                  } else {
                    const newCol: CustomColumn = {
                      field: `custom_${customColumns.length}`,
                      headerName: `${value.charAt(0).toUpperCase() + value.slice(1)} Field`,
                      type: value,
                    };
                    handleAddField(newCol);
                  }
                  setSelectKey(prev => prev + 1); // Force re-render to reset select
                }
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="➕ Add Field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>➕ Add Field</SelectItem>
                {FIELD_TYPES.map(ft => (
                  <SelectItem key={ft.key} value={ft.key}>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table 
          filters={dataSource === 'audience' ? filters : []} 
          previewData={dataSource === 'webhook' ? webhookData : previewRows}
          loading={loading}
          customColumns={customColumns}
          hiddenFields={hiddenFields}
          onAddField={handleAddField}
          onDeleteField={handleDeleteField}
        />
      </div>

      {/* Code Editor Modal */}
      {codeEditorVisible && codeField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">🧠 Custom Code Transform</h3>
              <button
                onClick={() => setCodeEditorVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Field
                </label>
                <Select 
                  value={codeField.sourceField} 
                  onValueChange={(value) => setCodeField(prev => prev ? { ...prev, sourceField: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="enrich_company">Company</SelectItem>
                    <SelectItem value="company_name">Company Name</SelectItem>
                    <SelectItem value="job_title">Job Title</SelectItem>
                    <SelectItem value="seniority">Seniority</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="industry">Industry</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                    <SelectItem value="gender">Gender</SelectItem>
                    <SelectItem value="income_range">Income Range</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JavaScript Transform Function
                </label>
                <div className="text-xs text-gray-500 mb-2">
                  Write a function that takes an input and returns the transformed value. Use 'input' as the parameter name.
                </div>
                <textarea
                  className="w-full h-40 border border-gray-300 rounded-md p-3 font-mono text-sm"
                  value={codeField.code}
                  onChange={(e) => setCodeField(prev => prev ? { ...prev, code: e.target.value } : null)}
                  placeholder="// Example: return input.split(',')[0].trim();"
                />
                
                {/* Real-time Preview */}
                {codeField.code && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="text-xs font-medium text-gray-700 mb-2">Preview:</div>
                    <div className="text-xs text-gray-600 font-mono">
                      {(() => {
                        try {
                          const testInput = "example@company.com, test@company.com";
                          const transformFn = new Function('input', codeField.code);
                          const result = transformFn(testInput);
                          return `Input: "${testInput}" → Output: "${result}"`;
                        } catch (error) {
                          return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    if (codeField) {
                      // Update the custom column with the code
                      setCustomColumns(prev => 
                        prev.map(col => 
                          col.field === codeField.field 
                            ? { ...col, transform: codeField.code, sourceField: codeField.sourceField }
                            : col
                        )
                      );
                      setCodeEditorVisible(false);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Code className="h-4 w-4" />
                  Save & Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCodeEditorVisible(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 