'use client';

import React from 'react';
import { Input } from '@kit/ui/input';

interface GeoRadiusValue {
  lat: number;
  lng: number;
  radiusKm: number;
}

interface GeoRadiusValueEditorProps {
  value: GeoRadiusValue;
  onChange: (value: GeoRadiusValue) => void;
  placeholder?: string;
}

export function GeoRadiusValueEditor({ value, onChange, placeholder = "Lat, Lng, Radius" }: GeoRadiusValueEditorProps) {
  const { lat, lng, radiusKm } = value;

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      onChange({ ...value, lat: numValue });
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      onChange({ ...value, lng: numValue });
    }
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      onChange({ ...value, radiusKm: numValue });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1">
      <Input
        type="number"
        step="any"
        value={lat || ''}
        onChange={handleLatChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        placeholder="Lat"
        className="flex-1"
      />
      <Input
        type="number"
        step="any"
        value={lng || ''}
        onChange={handleLngChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        placeholder="Lng"
        className="flex-1"
      />
      <Input
        type="number"
        step="any"
        value={radiusKm || ''}
        onChange={handleRadiusChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        placeholder="Radius (km)"
        className="flex-1"
      />
    </div>
  );
} 