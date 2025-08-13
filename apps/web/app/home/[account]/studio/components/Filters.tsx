'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { X, MousePointer, User, Plus } from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { cn } from '@kit/ui/utils';

interface Filter {
  id: string;
  group: "pixel_event" | "contact";
  field: string;
  operator: string;
  value: string;
}

interface Field {
  key: string;
  label: string;
  group?: "pixel_event" | "contact";
  category?: string;
}

interface FiltersProps {
  filters: Filter[];
  onChange: (filters: Filter[]) => void;
  fields: Field[];
  loading?: boolean;
  previewData?: any[];
  previewLoading?: boolean;
  onAddField?: (field: Field) => void;
  onRemoveField?: (fieldKey: string) => void;
  visibleFields?: Set<string>;
  onToggleField?: (fieldKey: string) => void;
}

interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  group: "pixel_event" | "contact";
}

const operators = [
  { value: '=', label: 'Equals' },
  { value: '!=', label: 'Does not equal' },
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '<=', label: 'Less than or equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'exists', label: 'Exists' },
];

const groups = [
  { value: 'pixel_event', label: 'Pixel Events', icon: MousePointer },
  { value: 'contact', label: 'Contact Data', icon: User },
];

export default function Filters({ 
  filters, 
  onChange, 
  fields, 
  loading = false,
  previewData = [],
  previewLoading = false,
  onAddField,
  onRemoveField,
  visibleFields = new Set(),
  onToggleField
}: FiltersProps) {
  const [selectedGroup, setSelectedGroup] = useState<"pixel_event" | "contact">('pixel_event');

  const getFieldsForGroup = (group: "pixel_event" | "contact") => {
    return fields.filter(field => {
      if (field.group) return field.group === group;
      if (field.category) {
        // Map categories to groups
        if (group === 'pixel_event') {
          return field.category.toLowerCase().includes('pixel') || field.category.toLowerCase().includes('event');
        } else {
          return field.category.toLowerCase().includes('contact') || field.category.toLowerCase().includes('personal') || field.category.toLowerCase().includes('company');
        }
      }
      return false;
    });
  };

  const addFilter = () => {
    const availableFields = getFieldsForGroup(selectedGroup);
    const newFilter: Filter = {
      id: Math.random().toString(36).substr(2, 9),
      group: selectedGroup,
      field: availableFields[0]?.key || fields[0]?.key || '',
      operator: '=',
      value: '',
    };
    const updatedFilters = [...filters, newFilter];
    onChange(updatedFilters);
  };

  const removeFilter = (id: string) => {
    const updatedFilters = filters.filter(filter => filter.id !== id);
    onChange(updatedFilters);
  };

  const updateFilter = (id: string, field: keyof Filter, value: string) => {
    const updatedFilters = filters.map(filter =>
      filter.id === id ? { ...filter, [field]: value } : filter
    );
    onChange(updatedFilters);
  };

  const getGroupIcon = (group: "pixel_event" | "contact") => {
    const groupData = groups.find(g => g.value === group);
    return groupData ? React.createElement(groupData.icon, { className: "h-4 w-4" }) : null;
  };

  const getFieldLabel = (fieldKey: string) => {
    const field = fields.find(f => f.key === fieldKey);
    return field?.label || fieldKey;
  };

  const getGroupLabel = (group: "pixel_event" | "contact") => {
    const groupData = groups.find(g => g.value === group);
    return groupData?.label || group;
  };

  if (loading) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-sm">
        <div className="text-center py-8 text-gray-500">
          <p>Loading fields...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Sub-Segment Filters</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedGroup} onValueChange={(value: "pixel_event" | "contact") => setSelectedGroup(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.value} value={group.value}>
                  <div className="flex items-center gap-2">
                    {React.createElement(group.icon, { className: "h-4 w-4" })}
                    {group.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
                      <Button onClick={addFilter} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Filter
            </Button>
        </div>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No filters applied. Select a group and click "Add Filter" to create a sub-segment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter) => (
            <div key={filter.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getGroupIcon(filter.group)}
                <span className="capitalize">{getGroupLabel(filter.group)}</span>
              </div>
              
              <Select
                value={filter.field}
                onValueChange={(value) => updateFilter(filter.id, 'field', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getFieldsForGroup(filter.group).map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filter.operator}
                onValueChange={(value) => updateFilter(filter.id, 'operator', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((operator) => (
                    <SelectItem key={operator.value} value={operator.value}>
                      {operator.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filter.operator !== 'exists' && (
                <Input
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                  placeholder="Enter value..."
                  className="flex-1"
                />
              )}

              <Button
                onClick={() => removeFilter(filter.id)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {filters.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Active Filters:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            {filters.map((filter) => (
              <div key={filter.id} className="flex items-center gap-2">
                <span className="capitalize">{getGroupLabel(filter.group)}:</span>
                <span>{getFieldLabel(filter.field)}</span>
                <span>{filter.operator}</span>
                {filter.operator !== 'exists' && (
                  <span className="font-medium">"{filter.value}"</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field Management Section */}
      {previewData.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-800">Field Management</h3>
            <div className="flex items-center gap-2">
              <Select value={selectedGroup} onValueChange={(value: "pixel_event" | "contact") => setSelectedGroup(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      <div className="flex items-center gap-2">
                        {React.createElement(group.icon, { className: "h-4 w-4" })}
                        {group.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Field Selector Dropdown */}
              <Select 
                onValueChange={(fieldKey) => {
                  if (fieldKey === 'show_all') {
                    // Show all fields in a modal or expand the list
                    console.log('Show all fields requested');
                    return;
                  }
                  
                  const selectedField = fields.find(f => f.key === fieldKey);
                  if (selectedField && onAddField) {
                    onAddField({
                      key: selectedField.key,
                      label: selectedField.label,
                      group: selectedField.group || selectedGroup
                    });
                  }
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select field to add..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Select field to add...
                  </SelectItem>
                  
                  {/* Popular/Important Fields First */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                    Popular Fields
                  </div>
                  {getFieldsForGroup(selectedGroup)
                    .filter(field => 
                      ['pixel_id', 'event_type', 'event_timestamp', 'FIRST_NAME', 'LAST_NAME', 'BUSINESS_EMAIL', 'COMPANY_NAME'].includes(field.key)
                    )
                    .map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label}
                      </SelectItem>
                    ))}
                  
                  {/* Other Fields */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                    Other Fields
                  </div>
                  {getFieldsForGroup(selectedGroup)
                    .filter(field => 
                      !['pixel_id', 'event_type', 'event_timestamp', 'FIRST_NAME', 'LAST_NAME', 'BUSINESS_EMAIL', 'COMPANY_NAME'].includes(field.key)
                    )
                    .slice(0, 20) // Limit to first 20 to prevent long dropdowns
                    .map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label}
                      </SelectItem>
                    ))}
                  
                  {getFieldsForGroup(selectedGroup).length > 21 && (
                    <SelectItem value="show_all" className="text-blue-600">
                      Show all {getFieldsForGroup(selectedGroup).length} fields...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Currently Visible Fields */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-blue-700">Currently Visible Fields:</h4>
            <div className="flex flex-wrap gap-2">
              {fields
                .filter(field => visibleFields.has(field.key))
                .slice(0, 10) // Show first 10 visible fields
                .map((field) => (
                  <div key={field.key} className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs">
                    <span className="truncate max-w-24">{field.label}</span>
                    {onRemoveField && (
                      <button
                        onClick={() => onRemoveField(field.key)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              {fields.filter(field => visibleFields.has(field.key)).length > 10 && (
                <div className="text-xs text-blue-600 px-2 py-1">
                  +{fields.filter(field => visibleFields.has(field.key)).length - 10} more fields
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {filters.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            Preview Results ({previewLoading ? 'Loading...' : previewData.length} rows)
          </h3>
          {previewLoading ? (
            <div className="text-sm text-green-700">Loading preview...</div>
          ) : previewData.length > 0 ? (
            <div className="text-sm text-green-700">
              <PreviewDataTable data={previewData} visibleFields={visibleFields} />
            </div>
          ) : (
            <div className="text-sm text-green-700">No results match your filters</div>
          )}
        </div>
      )}
    </div>
  );
}

// Preview Data Table Component
function PreviewDataTable({ data, visibleFields = new Set() }: { data: any[]; visibleFields?: Set<string> }) {
  const formatColumnName = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const columns = React.useMemo<ColumnDef<any>[]>(() => {
    if (data.length === 0) return [];

    const allKeys = new Set<string>();
    data.forEach((row) => {
      Object.keys(row).forEach((key) => allKeys.add(key));
    });

    const rowNumberColumn: ColumnDef<any> = {
      id: 'rowNumber',
      header: '#',
      cell: ({ row }) => row.index + 1,
      size: 40,
    };

    const dataColumns: ColumnDef<any>[] = Array.from(allKeys)
      .filter(key => visibleFields.size === 0 || visibleFields.has(key)) // Show all if no visibleFields specified
      .sort((a, b) => {
        // Prioritize important fields first
        const priority: Record<string, number> = {
          pixel_id: 1,
          event_type: 2,
          event_timestamp: 3,
          FIRST_NAME: 4,
          LAST_NAME: 5,
          BUSINESS_EMAIL: 6,
          COMPANY_NAME: 7,
        };
        const priorityA = priority[a] || 100;
        const priorityB = priority[b] || 100;
        return priorityA - priorityB;
      })
      .map((key) => ({
        accessorKey: key,
        header: formatColumnName(key),
        cell: ({ row }) => {
          const value = row.original[key];
          if (value === null || value === undefined) return '-';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        },
        size: 150,
      }));

    return [rowNumberColumn, ...dataColumns];
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="min-w-[100px]">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="max-w-[200px] truncate">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 