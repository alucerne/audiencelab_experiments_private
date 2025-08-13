'use client';

import React from 'react';
import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { Badge } from '@kit/ui/badge';
import { Trash2 } from 'lucide-react';
import { Condition } from '~/lib/audience/schema/boolean-filters.schema';
import { 
  getCategories, 
  getFieldsByCategory, 
  getOperatorsForField, 
  getFieldByKey 
} from '~/lib/audience/schema/field-registry';
import { ValueEditorFactory } from './ValueEditors/ValueEditorFactory';

interface BooleanRuleProps {
  rule: Condition;
  onUpdate: (rule: Condition) => void;
  onRemove: () => void;
  onToggleNot: () => void;
}

export function BooleanRule({ rule, onUpdate, onRemove, onToggleNot }: BooleanRuleProps) {
  const categories = getCategories();
  const fieldsInCategory = getFieldsByCategory(rule.category);
  const availableOperators = getOperatorsForField(rule.field);
  const selectedField = getFieldByKey(rule.field);

  const handleCategoryChange = (category: Condition['category']) => {
    const fieldsInNewCategory = getFieldsByCategory(category);
    const firstField = fieldsInNewCategory[0];
    
    if (firstField) {
      const operators = getOperatorsForField(firstField.key);
      const firstOperator = operators[0] || 'eq';
      
      // Get default value based on field type
      let defaultValue: unknown;
      switch (firstField.valueType) {
        case 'string':
          defaultValue = '';
          break;
        case 'number':
          defaultValue = 0;
          break;
        case 'numberRange':
          defaultValue = [0, 100];
          break;
        case 'enum':
          defaultValue = firstField.enumValues?.[0] || '';
          break;
        case 'enum[]':
          defaultValue = firstField.enumValues?.[0] ? [firstField.enumValues[0]] : [];
          break;
        case 'boolean':
          defaultValue = true;
          break;
        case 'dateRange':
          defaultValue = ['', ''];
          break;
        case 'geoRadius':
          defaultValue = { lat: 0, lng: 0, radiusKm: 10 };
          break;
        case 'string[]':
          defaultValue = [];
          break;
        default:
          defaultValue = '';
      }

      onUpdate({
        ...rule,
        category,
        field: firstField.key,
        op: firstOperator,
        value: defaultValue
      });
    }
  };

  const handleFieldChange = (fieldKey: string) => {
    const field = getFieldByKey(fieldKey);
    if (!field) return;

    const operators = getOperatorsForField(fieldKey);
    const firstOperator = operators[0] || 'eq';
    
    // Get default value based on field type
    let defaultValue: unknown;
    switch (field.valueType) {
      case 'string':
        defaultValue = '';
        break;
      case 'number':
        defaultValue = 0;
        break;
      case 'numberRange':
        defaultValue = [0, 100];
        break;
      case 'enum':
        defaultValue = field.enumValues?.[0] || '';
        break;
      case 'enum[]':
        defaultValue = field.enumValues?.[0] ? [field.enumValues[0]] : [];
        break;
      case 'boolean':
        defaultValue = true;
        break;
      case 'dateRange':
        defaultValue = ['', ''];
        break;
      case 'geoRadius':
        defaultValue = { lat: 0, lng: 0, radiusKm: 10 };
        break;
      case 'string[]':
        defaultValue = [];
        break;
      default:
        defaultValue = '';
    }

    onUpdate({
      ...rule,
      field: fieldKey,
      op: firstOperator,
      value: defaultValue
    });
  };

  const handleOperatorChange = (op: string) => {
    onUpdate({
      ...rule,
      op
    });
  };

  const handleValueChange = (value: unknown) => {
    onUpdate({
      ...rule,
      value
    });
  };

  const getOperatorLabel = (op: string) => {
    const operatorLabels: Record<string, string> = {
      'eq': '=',
      'neq': '≠',
      'in': 'in',
      'nin': 'not in',
      'contains': 'contains',
      'icontains': 'contains (case-insensitive)',
      'starts_with': 'starts with',
      'ends_with': 'ends with',
      'gte': '≥',
      'lte': '≤',
      'gt': '>',
      'lt': '<',
      'between': 'between',
      'exists': 'exists',
      'notExists': 'does not exist',
      'match': 'matches',
      'matchAny': 'matches any',
      'withinRadius': 'within radius',
      'isTrue': 'is true',
      'isFalse': 'is false'
    };
    return operatorLabels[op] || op;
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      'intent': 'Intent',
      'date': 'Date',
      'business': 'Business',
      'financial': 'Financial',
      'personal': 'Personal',
      'family': 'Family',
      'housing': 'Housing',
      'location': 'Location',
      'contact': 'Contact'
    };
    return categoryLabels[category] || category;
  };

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={rule.not ? "destructive" : "outline"}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleNot();
            }}
          >
            NOT
          </Button>
          
          {rule.not && (
            <Badge variant="destructive">NOT</Badge>
          )}
          
          {/* Category Select */}
          <Select value={rule.category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {getCategoryLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Field Select */}
          <Select value={rule.field} onValueChange={handleFieldChange}>
            <SelectTrigger className="w-48" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldsInCategory.map(field => (
                <SelectItem key={field.key} value={field.key}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Operator Select */}
          <Select value={rule.op} onValueChange={handleOperatorChange}>
            <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableOperators.map(op => (
                <SelectItem key={op} value={op}>
                  {getOperatorLabel(op)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Value Editor */}
          <ValueEditorFactory
            fieldKey={rule.field}
            value={rule.value}
            onChange={handleValueChange}
            placeholder={selectedField?.description}
          />
          
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 