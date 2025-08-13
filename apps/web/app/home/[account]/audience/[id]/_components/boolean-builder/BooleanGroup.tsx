'use client';

import React from 'react';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { Plus, Trash2, X } from 'lucide-react';
import { Group, Condition } from '~/lib/audience/schema/boolean-filters.schema';

interface BooleanGroupProps {
  group: Group;
  onAddRule: () => void;
  onAddGroup: () => void;
  onRemove: () => void;
  onUpdate: (group: Group) => void;
  onToggleNot: () => void;
  onChangeOp: (op: 'AND' | 'OR') => void;
  renderNode: (node: Group | Condition, parentGroup: Group, index: number) => React.ReactNode;
}

export function BooleanGroup({
  group,
  onAddRule,
  onAddGroup,
  onRemove,
  onUpdate,
  onToggleNot,
  onChangeOp,
  renderNode
}: BooleanGroupProps) {
  const removeNode = (index: number) => {
    const updatedGroup = {
      ...group,
      children: group.children.filter((_, i) => i !== index)
    };
    onUpdate(updatedGroup);
  };

  const updateNode = (index: number, node: Group | Condition) => {
    const updatedGroup = {
      ...group,
      children: group.children.map((child, i) => i === index ? node : child)
    };
    onUpdate(updatedGroup);
  };

  const addRule = () => {
    const { FIELD_CATALOG_V1 } = require('~/lib/unifiedFieldCatalog');
    const { isB2BField } = require('~/lib/audience/boolean-transform');
    
    const b2bFields = FIELD_CATALOG_V1.filter((field: any) => isB2BField(field.key));
    const firstField = b2bFields[0]?.key || 'COMPANY_NAME';
    
    const newRule: Condition = {
      kind: 'condition',
      field: firstField,
      op: 'equals',
      value: '',
    };

    const updatedGroup = {
      ...group,
      children: [...group.children, newRule]
    };
    onUpdate(updatedGroup);
  };

  const addGroup = () => {
    const newGroup: Group = {
      kind: 'group',
      op: 'AND',
      children: []
    };

    const updatedGroup = {
      ...group,
      children: [...group.children, newGroup]
    };
    onUpdate(updatedGroup);
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={group.op} onValueChange={(value: 'AND' | 'OR') => onChangeOp(value)}>
              <SelectTrigger className="w-20" onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              type="button"
              variant={group.not ? "destructive" : "outline"}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleNot();
              }}
            >
              NOT
            </Button>
            
            {group.not && (
              <Badge variant="destructive">NOT</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addRule();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Rule
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addGroup();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Group
            </Button>
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
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 pl-4 border-l-2 border-gray-200">
          {group.children.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No rules in this group
            </div>
          ) : (
            group.children.map((node, index) => renderNode(node, group, index))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 