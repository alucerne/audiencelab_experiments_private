'use client';

import React from 'react';
import { Input } from '@kit/ui/input';

interface StringValueEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function StringValueEditor({ value, onChange, placeholder = "Enter value..." }: StringValueEditorProps) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      placeholder={placeholder}
      className="flex-1"
    />
  );
} 