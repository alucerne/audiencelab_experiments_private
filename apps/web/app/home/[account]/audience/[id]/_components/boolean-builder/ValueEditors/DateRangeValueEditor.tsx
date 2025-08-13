'use client';

import React from 'react';
import { Input } from '@kit/ui/input';

interface DateRangeValueEditorProps {
  value: [string, string];
  onChange: (value: [string, string]) => void;
  placeholder?: string;
}

export function DateRangeValueEditor({ value, onChange, placeholder = "Start, End" }: DateRangeValueEditorProps) {
  const [startDate, endDate] = value;

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange([e.target.value, endDate]);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange([startDate, e.target.value]);
  };

  return (
    <div className="flex items-center gap-2 flex-1">
      <Input
        type="date"
        value={startDate || ''}
        onChange={handleStartChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="flex-1"
      />
      <span className="text-muted-foreground">to</span>
      <Input
        type="date"
        value={endDate || ''}
        onChange={handleEndChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="flex-1"
      />
    </div>
  );
} 