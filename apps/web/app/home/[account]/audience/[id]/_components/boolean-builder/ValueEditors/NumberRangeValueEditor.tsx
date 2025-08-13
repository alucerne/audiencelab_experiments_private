'use client';

import React from 'react';
import { Input } from '@kit/ui/input';

interface NumberRangeValueEditorProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  placeholder?: string;
}

export function NumberRangeValueEditor({ value, onChange, placeholder = "Min, Max" }: NumberRangeValueEditorProps) {
  const [min, max] = value;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      onChange([numValue, max]);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      onChange([min, numValue]);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1">
      <Input
        type="number"
        value={min || ''}
        onChange={handleMinChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        placeholder="Min"
        className="flex-1"
      />
      <span className="text-muted-foreground">to</span>
      <Input
        type="number"
        value={max || ''}
        onChange={handleMaxChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        placeholder="Max"
        className="flex-1"
      />
    </div>
  );
} 