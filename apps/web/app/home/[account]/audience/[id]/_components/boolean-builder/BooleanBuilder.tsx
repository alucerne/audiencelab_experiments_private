'use client';

import React from 'react';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';
import { BooleanExpression, Condition, Group, defaultBooleanExpression } from '~/lib/audience/schema/boolean-filters.schema';
import { BooleanGroup } from './BooleanGroup';
import { BooleanRule } from './BooleanRule';
import { getCategories, getFieldsByCategory, getOperatorsForField } from '~/lib/audience/schema/field-registry';
import { simpleToBoolean } from '~/lib/audience/simple-to-boolean';

interface BooleanBuilderProps {
  expression: BooleanExpression;
  onChange: (expression: BooleanExpression) => void;
  onReset: () => void;
  simpleFilters?: Record<string, any>; // For importing from simple mode
}

export function BooleanBuilder({ expression, onChange, onReset, simpleFilters }: BooleanBuilderProps) {
  console.log('BooleanBuilder render with expression:', expression);
  
  const addRule = (parentGroup: Group) => {
    const categories = getCategories();
    const firstCategory = categories[0];
    
    if (firstCategory) {
      const fieldsInCategory = getFieldsByCategory(firstCategory);
      const firstField = fieldsInCategory[0];
      
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
        
        const newRule: Condition = {
          kind: 'condition',
          category: firstCategory,
          field: firstField.key,
          op: firstOperator,
          value: defaultValue
        };

        const updatedGroup = {
          ...parentGroup,
          children: [...parentGroup.children, newRule]
        };

        updateGroup(parentGroup, updatedGroup);
      }
    }
  };

  const addGroup = (parentGroup: Group) => {
    const newGroup: Group = {
      kind: 'group',
      op: 'AND',
      children: []
    };

    const updatedGroup = {
      ...parentGroup,
      children: [...parentGroup.children, newGroup]
    };

    updateGroup(parentGroup, updatedGroup);
  };

  const updateGroup = (targetGroup: Group, updatedGroup: Group) => {
    const updateGroupRecursive = (group: Group): Group => {
      if (group === targetGroup) {
        return updatedGroup;
      }

      return {
        ...group,
        children: group.children.map(child => 
          child.kind === 'group' ? updateGroupRecursive(child) : child
        )
      };
    };

    const newExpression = updateGroupRecursive(expression);
    console.log('BooleanBuilder updating expression:', newExpression);
    onChange(newExpression);
  };

  const removeNode = (parentGroup: Group, index: number) => {
    const updatedGroup = {
      ...parentGroup,
      children: parentGroup.children.filter((_, i) => i !== index)
    };

    updateGroup(parentGroup, updatedGroup);
  };

  const updateNode = (parentGroup: Group, index: number, node: Group | Condition) => {
    const updatedGroup = {
      ...parentGroup,
      children: parentGroup.children.map((child, i) => i === index ? node : child)
    };

    updateGroup(parentGroup, updatedGroup);
  };

  const toggleGroupNot = (group: Group) => {
    const updatedGroup = {
      ...group,
      not: !group.not
    };

    updateGroup(group, updatedGroup);
  };

  const changeGroupOp = (group: Group, op: 'AND' | 'OR') => {
    const updatedGroup = {
      ...group,
      op
    };

    updateGroup(group, updatedGroup);
  };

  const renderNode = (node: Group | Condition, parentGroup: Group, index: number) => {
    if (node.kind === 'group') {
      return (
        <BooleanGroup
          key={index}
          group={node}
          onAddRule={() => addRule(node)}
          onAddGroup={() => addGroup(node)}
          onRemove={() => removeNode(parentGroup, index)}
          onUpdate={(updatedGroup: Group) => updateNode(parentGroup, index, updatedGroup)}
          onToggleNot={() => toggleGroupNot(node)}
          onChangeOp={(op: 'AND' | 'OR') => changeGroupOp(node, op)}
          renderNode={renderNode}
        />
      );
    } else {
      return (
        <BooleanRule
          key={index}
          rule={node}
          onUpdate={(updatedRule: Condition) => updateNode(parentGroup, index, updatedRule)}
          onRemove={() => removeNode(parentGroup, index)}
          onToggleNot={() => {
            const updatedRule = {
              ...node,
              not: !node.not
            };
            updateNode(parentGroup, index, updatedRule);
          }}
        />
      );
    }
  };

  const expressionPreview = generateExpressionPreview(expression);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Boolean Builder
            <Badge variant="secondary">BETA</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {simpleFilters && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const booleanExpression = simpleToBoolean(simpleFilters);
                  onChange(booleanExpression);
                }}
              >
                Import from Simple
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReset();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
        {expressionPreview && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Preview:</span> {expressionPreview}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expression.children.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No rules added yet</p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addRule(expression);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addGroup(expression);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {expression.children.map((node, index) => renderNode(node, expression, index))}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addRule(expression);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addGroup(expression);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate a human-readable preview of the expression
function generateExpressionPreview(expression: BooleanExpression): string {
  const formatCondition = (condition: Condition): string => {
    const field = condition.field;
    const operator = condition.op;
    const value = Array.isArray(condition.value) ? condition.value.join(', ') : condition.value;
    const prefix = condition.not ? 'NOT ' : '';
    return `${prefix}${field} ${operator} ${value}`;
  };

  const formatGroup = (group: Group): string => {
    if (group.children.length === 0) return 'empty';
    
    const childrenStr = group.children.map(child => 
      child.kind === 'group' ? formatGroup(child) : formatCondition(child)
    ).join(` ${group.op} `);
    
    const prefix = group.not ? 'NOT ' : '';
    return `${prefix}(${childrenStr})`;
  };

  return formatGroup(expression);
} 