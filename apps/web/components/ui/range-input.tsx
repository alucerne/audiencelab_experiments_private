import { useEffect, useState } from 'react';

import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

interface RangeInputProps {
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
}

export function RangeInput({ value, onChange }: RangeInputProps) {
  const [localMin, setLocalMin] = useState(() => String(value.min));
  const [localMax, setLocalMax] = useState(() => String(value.max));

  useEffect(() => {
    setLocalMin(String(value.min));
    setLocalMax(String(value.max));
  }, [value.min, value.max]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
      setLocalMin(newValue);
      onChange({
        ...value,
        min: newValue === '' ? 0 : Number(newValue),
      });
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
      setLocalMax(newValue);
      onChange({
        ...value,
        max: newValue === '' ? 0 : Number(newValue),
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
        />
      </div>
    </div>
  );
}
