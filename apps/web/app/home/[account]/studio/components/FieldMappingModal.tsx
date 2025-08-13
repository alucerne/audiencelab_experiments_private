import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { Badge } from '@kit/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FieldMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMappingComplete: (mappedData: any[]) => void;
  webhookData: any[];
  webhookId: string;
}

// Standard fields that can be used for enrichment
const STANDARD_FIELDS = [
  { key: 'business_email', label: 'Business Email', required: false },
  { key: 'personal_email', label: 'Personal Email', required: false },
  { key: 'email', label: 'Email (Generic)', required: false },
  { key: 'domain', label: 'Company Domain', required: false },
  { key: 'company_domain', label: 'Company Domain (Alt)', required: false },
  { key: 'company_name', label: 'Company Name', required: false },
  { key: 'first_name', label: 'First Name', required: false },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'full_name', label: 'Full Name', required: false },
  { key: 'phone', label: 'Phone Number', required: false },
  { key: 'mobile_phone', label: 'Mobile Phone', required: false },
  { key: 'title', label: 'Job Title', required: false },
  { key: 'location', label: 'Location', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'zip_code', label: 'Zip Code', required: false },
  { key: 'industry', label: 'Industry', required: false },
  { key: 'company_size', label: 'Company Size', required: false },
  { key: 'seniority', label: 'Seniority', required: false },
  { key: 'department', label: 'Department', required: false },
  { key: 'linkedin_url', label: 'LinkedIn URL', required: false },
  { key: 'company_revenue', label: 'Company Revenue', required: false },
  { key: 'technologies', label: 'Technologies Used', required: false },
  { key: 'DO_NOT_IMPORT', label: 'Do Not Import', required: false },
];

export default function FieldMappingModal({
  isOpen,
  onClose,
  onMappingComplete,
  webhookData,
  webhookId
}: FieldMappingModalProps) {
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [webhookFields, setWebhookFields] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Extract webhook fields when data changes
  useEffect(() => {
    if (webhookData.length > 0) {
      const fields = Object.keys(webhookData[0]).filter(field => !field.startsWith('_webhook_'));
      setWebhookFields(fields);
      
      // Auto-map common fields
      const autoMapping: Record<string, string> = {};
      fields.forEach(field => {
        const normalizedField = field.toLowerCase().replace(/[_\s]+/g, '');
        
        // Auto-map common patterns
        if (normalizedField.includes('email')) {
          if (normalizedField.includes('personal')) {
            autoMapping[field] = 'personal_email';
          } else if (normalizedField.includes('business')) {
            autoMapping[field] = 'business_email';
          } else {
            autoMapping[field] = 'email';
          }
        } else if (normalizedField.includes('domain')) {
          autoMapping[field] = 'domain';
        } else if (normalizedField.includes('company') && normalizedField.includes('name')) {
          autoMapping[field] = 'company_name';
        } else if (normalizedField.includes('first') && normalizedField.includes('name')) {
          autoMapping[field] = 'first_name';
        } else if (normalizedField.includes('last') && normalizedField.includes('name')) {
          autoMapping[field] = 'last_name';
        } else if (normalizedField.includes('name') && !normalizedField.includes('first') && !normalizedField.includes('last')) {
          autoMapping[field] = 'full_name';
        } else if (normalizedField.includes('phone')) {
          if (normalizedField.includes('mobile')) {
            autoMapping[field] = 'mobile_phone';
          } else {
            autoMapping[field] = 'phone';
          }
        } else if (normalizedField.includes('title')) {
          autoMapping[field] = 'title';
        }
      });
      
      setFieldMap(autoMapping);
    }
  }, [webhookData]);

  const handleFieldMapping = () => {
    if (webhookData.length === 0) {
      toast.error('No webhook data to process');
      return;
    }

    // Check if we have any field mappings
    const mappedFields = Object.values(fieldMap).filter(field => field !== '' && field !== 'DO_NOT_IMPORT');
    if (mappedFields.length === 0) {
      toast.error('Please map at least one field before processing');
      return;
    }

    // Check if we have at least one identifier field for enrichment
    const identifierFields = ['business_email', 'personal_email', 'email', 'domain', 'company_domain'];
    const hasIdentifier = mappedFields.some(field => identifierFields.includes(field));
    
    if (!hasIdentifier) {
      toast.warning('No email or domain field mapped. Enrichment may not work properly.');
    }

    setIsProcessing(true);

    try {
      // Normalize the data based on field mappings
      const normalizedData = webhookData.map(row => {
        const normalizedRow: Record<string, any> = {};
        
        // Add mapped fields
        Object.entries(fieldMap).forEach(([webhookField, targetField]) => {
          if (targetField && targetField !== '' && targetField !== 'DO_NOT_IMPORT') {
            normalizedRow[targetField] = row[webhookField] || '';
          }
        });
        
        // Preserve webhook metadata
        Object.keys(row).forEach(key => {
          if (key.startsWith('_webhook_')) {
            normalizedRow[key] = row[key];
          }
        });
        
        return normalizedRow;
      });

      console.log('Webhook data normalized with mappings:', {
        originalRows: webhookData.length,
        normalizedRows: normalizedData.length,
        fieldMap,
        mappedFields,
        sampleRow: normalizedData[0],
        hasIdentifier
      });

      onMappingComplete(normalizedData);
      toast.success(`Webhook data processed! ${normalizedData.length} rows mapped and ready for enrichment.`);
      onClose();
    } catch (error) {
      console.error('Error processing webhook data:', error);
      toast.error('Failed to process webhook data');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFieldSelect = (webhookField: string, targetField: string) => {
    setFieldMap(prev => ({
      ...prev,
      [webhookField]: targetField
    }));
  };

  const getSelectedValue = (webhookField: string) => {
    return fieldMap[webhookField] || '';
  };

  const getMappedFieldsCount = () => {
    return Object.values(fieldMap).filter(field => field !== '' && field !== 'DO_NOT_IMPORT').length;
  };

  const hasIdentifierField = () => {
    const identifierFields = ['business_email', 'personal_email', 'email', 'domain', 'company_domain'];
    return Object.values(fieldMap).some(field => identifierFields.includes(field));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Map Webhook Fields
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Map incoming webhook fields to standard fields for enrichment
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Webhook ID: {webhookId} • {webhookData.length} records
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {getMappedFieldsCount()} fields mapped
              </Badge>
              {hasIdentifierField() && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready for enrichment
                </Badge>
              )}
            </div>
          </div>

          {!hasIdentifierField() && getMappedFieldsCount() > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                No email or domain field mapped. Add one for enrichment to work properly.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="font-semibold text-sm">Webhook Field</div>
            <div className="font-semibold text-sm">Map To</div>
            <div className="font-semibold text-sm">Sample Value</div>
          </div>

          {webhookFields.map((field) => (
            <div key={field} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{field}</span>
                {getSelectedValue(field) && getSelectedValue(field) !== 'DO_NOT_IMPORT' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              
              <Select
                value={getSelectedValue(field)}
                onValueChange={(value) => handleFieldSelect(field, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent>
                  {STANDARD_FIELDS.map((standardField) => (
                    <SelectItem key={standardField.key} value={standardField.key}>
                      {standardField.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-sm text-gray-600 truncate">
                {webhookData[0]?.[field] ? (
                  <span title={webhookData[0][field]}>
                    {webhookData[0][field].toString().substring(0, 30)}
                    {webhookData[0][field].toString().length > 30 ? '...' : ''}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleFieldMapping} 
            disabled={isProcessing || getMappedFieldsCount() === 0}
          >
            {isProcessing ? 'Processing...' : 'Process Data'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 