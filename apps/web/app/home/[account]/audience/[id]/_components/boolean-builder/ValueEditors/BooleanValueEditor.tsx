'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';

interface BooleanValueEditorProps {
  value: boolean;
  onChange: (value: boolean) => void;
  placeholder?: string;
}

export function BooleanValueEditor({ value, onChange, placeholder = "Select value..." }: BooleanValueEditorProps) {
  return (
    <Select value={value.toString()} onValueChange={(val) => onChange(val === 'true')}>
      <SelectTrigger className="flex-1" onClick={(e) => e.stopPropagation()}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">True</SelectItem>
        <SelectItem value="false">False</SelectItem>
      </SelectContent>
    </Select>
  );
} 