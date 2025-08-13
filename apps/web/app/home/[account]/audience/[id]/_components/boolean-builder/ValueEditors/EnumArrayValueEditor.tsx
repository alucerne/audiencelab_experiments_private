'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { X } from 'lucide-react';

interface EnumArrayValueEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  enumValues: string[];
  placeholder?: string;
}

export function EnumArrayValueEditor({ value, onChange, enumValues, placeholder = "Select values..." }: EnumArrayValueEditorProps) {
  const [selectedValue, setSelectedValue] = useState<string>('');

  const handleAdd = () => {
    if (selectedValue && !value.includes(selectedValue)) {
      onChange([...value, selectedValue]);
      setSelectedValue('');
    }
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter(item => item !== itemToRemove));
  };

  const availableValues = enumValues.filter(enumValue => !value.includes(enumValue));

  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="flex items-center gap-2">
        <Select value={selectedValue} onValueChange={setSelectedValue}>
          <SelectTrigger className="flex-1" onClick={(e) => e.stopPropagation()}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {availableValues.map(enumValue => (
              <SelectItem key={enumValue} value={enumValue}>
                {enumValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAdd();
          }}
          disabled={!selectedValue}
        >
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map(item => (
            <Badge key={item} variant="secondary" className="flex items-center gap-1">
              {item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-auto p-0 ml-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemove(item);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 