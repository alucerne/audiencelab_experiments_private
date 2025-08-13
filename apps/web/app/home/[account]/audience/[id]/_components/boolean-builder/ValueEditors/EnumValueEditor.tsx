'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';

interface EnumValueEditorProps {
  value: string;
  onChange: (value: string) => void;
  enumValues: string[];
  placeholder?: string;
}

export function EnumValueEditor({ value, onChange, enumValues, placeholder = "Select value..." }: EnumValueEditorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="flex-1" onClick={(e) => e.stopPropagation()}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {enumValues.map(enumValue => (
          <SelectItem key={enumValue} value={enumValue}>
            {enumValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 