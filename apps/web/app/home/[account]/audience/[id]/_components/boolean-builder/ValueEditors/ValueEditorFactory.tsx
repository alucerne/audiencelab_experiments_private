'use client';

import React from 'react';
import { getFieldByKey, getEnumValuesForField } from '~/lib/audience/schema/field-registry';
import { StringValueEditor } from './StringValueEditor';
import { NumberValueEditor } from './NumberValueEditor';
import { NumberRangeValueEditor } from './NumberRangeValueEditor';
import { EnumValueEditor } from './EnumValueEditor';
import { EnumArrayValueEditor } from './EnumArrayValueEditor';
import { BooleanValueEditor } from './BooleanValueEditor';
import { DateRangeValueEditor } from './DateRangeValueEditor';
import { GeoRadiusValueEditor } from './GeoRadiusValueEditor';
import { StringArrayValueEditor } from './StringArrayValueEditor';

interface ValueEditorFactoryProps {
  fieldKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
}

export function ValueEditorFactory({ fieldKey, value, onChange, placeholder }: ValueEditorFactoryProps) {
  const field = getFieldByKey(fieldKey);
  
  if (!field) {
    return (
      <div className="text-red-500 text-sm">
        Unknown field: {fieldKey}
      </div>
    );
  }

  const { valueType } = field;
  const enumValues = getEnumValuesForField(fieldKey);

  switch (valueType) {
    case 'string':
      return (
        <StringValueEditor
          value={value as string}
          onChange={(val) => onChange(val)}
          placeholder={placeholder}
        />
      );

    case 'number':
      return (
        <NumberValueEditor
          value={value as number}
          onChange={(val) => onChange(val)}
          placeholder={placeholder}
        />
      );

    case 'numberRange':
      return (
        <NumberRangeValueEditor
          value={value as [number, number]}
          onChange={(val) => onChange(val)}
          placeholder={placeholder}
        />
      );

    case 'enum':
      if (!enumValues) {
        return <div className="text-red-500 text-sm">No enum values defined for {fieldKey}</div>;
      }
      return (
        <EnumValueEditor
          value={value as string}
          onChange={(val) => onChange(val)}
          enumValues={enumValues}
          placeholder={placeholder}
        />
      );

    case 'enum[]':
      if (!enumValues) {
        return <div className="text-red-500 text-sm">No enum values defined for {fieldKey}</div>;
      }
      return (
        <EnumArrayValueEditor
          value={value as string[]}
          onChange={(val) => onChange(val)}
          enumValues={enumValues}
          placeholder={placeholder}
        />
      );

    case 'boolean':
      return (
        <BooleanValueEditor
          value={value as boolean}
          onChange={(val) => onChange(val)}
          placeholder={placeholder}
        />
      );

    case 'dateRange':
      return (
        <DateRangeValueEditor
          value={value as [string, string]}
          onChange={(val) => onChange(val)}
          placeholder={placeholder}
        />
      );

    case 'geoRadius':
      return (
        <GeoRadiusValueEditor
          value={value as { lat: number; lng: number; radiusKm: number }}
          onChange={(val) => onChange(val)}
          placeholder={placeholder}
        />
      );

    case 'string[]':
      return (
        <StringArrayValueEditor
          value={value as string[]}
          onChange={(val) => onChange(val)}
          placeholder={placeholder}
        />
      );

    default:
      return (
        <div className="text-red-500 text-sm">
          Unsupported value type: {valueType}
        </div>
      );
  }
} 