'use client';

import React from 'react';
import { Input } from '@kit/ui/input';

interface NumberValueEditorProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

export function NumberValueEditor({ value, onChange, placeholder = "Enter number..." }: NumberValueEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else if (e.target.value === '') {
      onChange(0);
    }
  };

  return (
    <Input
      type="number"
      value={value || ''}
      onChange={handleChange}
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