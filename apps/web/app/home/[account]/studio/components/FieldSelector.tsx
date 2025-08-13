'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Checkbox } from '@kit/ui/checkbox';
import { Input } from '@kit/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { MousePointer, Database, Search, X } from 'lucide-react';

interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  group: "pixel_event" | "contact";
}

interface FieldSelectorProps {
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
  isPixelAudience?: boolean;
}

const groups = [
  { value: 'pixel_event', label: 'Pixel Events', icon: MousePointer },
  { value: 'contact', label: 'Contact Data', icon: Database },
];

export default function FieldSelector({ selectedFields, onFieldsChange, isPixelAudience = false }: FieldSelectorProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<"pixel_event" | "contact">(isPixelAudience ? 'pixel_event' : 'contact');

  // Fetch fields from the API
  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/studio/filters/fields');
        if (response.ok) {
          const data = await response.json();
          setFields(data.fields || []);
        } else {
          console.error('Failed to fetch fields:', response.status);
        }
      } catch (error) {
        console.error('Error fetching fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  const getFieldsForGroup = (group: "pixel_event" | "contact") => {
    return fields.filter(field => field.group === group);
  };

  const getFilteredFields = () => {
    const groupFields = getFieldsForGroup(selectedGroup);
    if (!searchTerm) return groupFields;
    
    return groupFields.filter(field => 
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.key.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const toggleField = (fieldKey: string) => {
    const newSelectedFields = selectedFields.includes(fieldKey)
      ? selectedFields.filter(f => f !== fieldKey)
      : [...selectedFields, fieldKey];
    
    onFieldsChange(newSelectedFields);
  };

  const selectAllFields = () => {
    const groupFields = getFieldsForGroup(selectedGroup);
    const fieldKeys = groupFields.map(f => f.key);
    onFieldsChange([...new Set([...selectedFields, ...fieldKeys])]);
  };

  const deselectAllFields = () => {
    const groupFields = getFieldsForGroup(selectedGroup);
    const fieldKeys = groupFields.map(f => f.key);
    onFieldsChange(selectedFields.filter(f => !fieldKeys.includes(f)));
  };

  const getGroupIcon = (group: "pixel_event" | "contact") => {
    const groupData = groups.find(g => g.value === group);
    return groupData ? React.createElement(groupData.icon, { className: "h-4 w-4" }) : null;
  };

  const getGroupLabel = (group: "pixel_event" | "contact") => {
    const groupData = groups.find(g => g.value === group);
    return groupData?.label || group;
  };

  if (loading) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-sm">
        <div className="text-center py-8 text-gray-500">
          <p>Loading fields...</p>
        </div>
      </div>
    );
  }

  const filteredFields = getFilteredFields();
  const selectedCount = selectedFields.length;

  return (
    <div className="bg-white p-4 border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Select Fields</h2>
        <div className="text-sm text-gray-500">
          {selectedCount} field{selectedCount !== 1 ? 's' : ''} selected
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Select value={selectedGroup} onValueChange={(value: "pixel_event" | "contact") => setSelectedGroup(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.value} value={group.value}>
                <div className="flex items-center gap-2">
                  {React.createElement(group.icon, { className: "h-4 w-4" })}
                  {group.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={selectAllFields} size="sm" variant="outline">
            Select All
          </Button>
          <Button onClick={deselectAllFields} size="sm" variant="outline">
            Deselect All
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No fields found matching your search.</p>
          </div>
        ) : (
          filteredFields.map((field) => (
            <div
              key={field.key}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
              onClick={() => toggleField(field.key)}
            >
              <Checkbox
                checked={selectedFields.includes(field.key)}
                onChange={() => toggleField(field.key)}
              />
              <div className="flex-1">
                <div className="font-medium">{field.label}</div>
                <div className="text-sm text-gray-500">{field.key}</div>
              </div>
              <div className="text-xs text-gray-400 capitalize">{field.type}</div>
            </div>
          ))
        )}
      </div>

      {selectedFields.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Selected Fields:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedFields.map((fieldKey) => {
              const field = fields.find(f => f.key === fieldKey);
              return (
                <div
                  key={fieldKey}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                >
                  <span>{field?.label || fieldKey}</span>
                  <button
                    onClick={() => toggleField(fieldKey)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 