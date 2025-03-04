import { useEffect, useState } from 'react';

import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

interface RangeInputProps {
  value: { min: number | null; max: number | null };
  onChange: (value: { min: number | null; max: number | null }) => void;
}

export function RangeInput({ value, onChange }: RangeInputProps) {
  const [localMin, setLocalMin] = useState(() =>
    value.min === null ? '' : String(value.min),
  );
  const [localMax, setLocalMax] = useState(() =>
    value.max === null ? '' : String(value.max),
  );

  // Update local state when props change
  useEffect(() => {
    setLocalMin(value.min === null ? '' : String(value.min));
    setLocalMax(value.max === null ? '' : String(value.max));
  }, [value.min, value.max]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
      setLocalMin(newValue);
      onChange({
        ...value,
        min: newValue === '' ? null : Number(newValue),
      });
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
      setLocalMax(newValue);
      onChange({
        ...value,
        max: newValue === '' ? null : Number(newValue),
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="min">Min</Label>
        <Input
          id="min"
          type="text"
          inputMode="numeric"
          pattern="-?\d*\.?\d*"
          value={localMin}
          onChange={handleMinChange}
          placeholder="Enter minimum value"
        />
      </div>
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="max">Max</Label>
        <Input
          id="max"
          type="text"
          inputMode="numeric"
          pattern="-?\d*\.?\d*"
          value={localMax}
          onChange={handleMaxChange}
          placeholder="Enter maximum value"
        />
      </div>
    </div>
  );
}
