'use client';

import React, { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { Plus, X, Building2, User, Wallet, MapPin, Home, Users } from 'lucide-react';

interface Filter {
  id: string;
  category: string;
  field: string;
  operator: string;
  value: string;
}

interface FiltersProps {
  onChange: (filters: Filter[]) => void;
}

// Business Profile Fields
const businessFields = [
  { name: 'company_description', label: 'Company Description' },
  { name: 'job_title', label: 'Job Title' },
  { name: 'seniority', label: 'Seniority' },
  { name: 'department', label: 'Department' },
  { name: 'company_name', label: 'Company Name' },
  { name: 'company_domain', label: 'Company Domain' },
  { name: 'industry', label: 'Industry' },
  { name: 'sic', label: 'SIC Code' },
  { name: 'employee_count', label: 'Employee Count' },
  { name: 'company_revenue', label: 'Company Revenue' },
  { name: 'company_naics', label: 'Company NAICS' },
];

// Personal Fields
const personalFields = [
  { name: 'age', label: 'Age' },
  { name: 'gender', label: 'Gender' },
  { name: 'ethnic_code', label: 'Ethnicity' },
  { name: 'language_code', label: 'Language' },
  { name: 'education', label: 'Education' },
  { name: 'smoker', label: 'Smoker' },
];

// Financial Fields
const financialFields = [
  { name: 'income_range', label: 'Income Range' },
  { name: 'net_worth', label: 'Net Worth' },
  { name: 'credit_rating', label: 'Credit Rating' },
  { name: 'credit_range_new_credit', label: 'New Credit Range' },
  { name: 'credit_card_user', label: 'Credit Card User' },
  { name: 'investment', label: 'Investment' },
  { name: 'mortgage_amount', label: 'Mortgage Amount' },
  { name: 'occupation_group', label: 'Occupation Group' },
  { name: 'occupation_type', label: 'Occupation Type' },
  { name: 'cra_code', label: 'CRA Code' },
];

// Family Fields
const familyFields = [
  { name: 'homeowner', label: 'Homeowner' },
  { name: 'married', label: 'Married' },
  { name: 'children', label: 'Children' },
  { name: 'single_parent', label: 'Single Parent' },
  { name: 'marital_status', label: 'Marital Status' },
  { name: 'generations_in_household', label: 'Generations in Household' },
];

// Housing Fields
const housingFields = [
  { name: 'home_year_built', label: 'Home Year Built' },
  { name: 'dwelling_type', label: 'Dwelling Type' },
  { name: 'home_purchase_price', label: 'Home Purchase Price' },
  { name: 'home_purchase_year', label: 'Home Purchase Year' },
  { name: 'estimated_home_value', label: 'Estimated Home Value' },
];

// Location Fields
const locationFields = [
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'zip', label: 'Zip Code' },
];

// All fields combined
const allFields = [
  ...businessFields,
  ...personalFields,
  ...financialFields,
  ...familyFields,
  ...housingFields,
  ...locationFields,
];

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'in', label: 'In (comma separated)' },
];

const categories = [
  { value: 'business', label: 'Business', icon: Building2 },
  { value: 'personal', label: 'Personal', icon: User },
  { value: 'financial', label: 'Financial', icon: Wallet },
  { value: 'family', label: 'Family', icon: Users },
  { value: 'housing', label: 'Housing', icon: Home },
  { value: 'location', label: 'Location', icon: MapPin },
];

export default function Filters({ onChange }: FiltersProps) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('business');

  const getFieldsForCategory = (category: string) => {
    switch (category) {
      case 'business':
        return businessFields;
      case 'personal':
        return personalFields;
      case 'financial':
        return financialFields;
      case 'family':
        return familyFields;
      case 'housing':
        return housingFields;
      case 'location':
        return locationFields;
      default:
        return businessFields;
    }
  };

  const addFilter = () => {
    const fields = getFieldsForCategory(selectedCategory);
    const newFilter: Filter = {
      id: Math.random().toString(36).substr(2, 9),
      category: selectedCategory,
      field: fields[0]?.name || 'company_name',
      operator: 'equals',
      value: '',
    };
    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    onChange(updatedFilters);
  };

  const removeFilter = (id: string) => {
    const updatedFilters = filters.filter(filter => filter.id !== id);
    setFilters(updatedFilters);
    onChange(updatedFilters);
  };

  const updateFilter = (id: string, field: keyof Filter, value: string) => {
    const updatedFilters = filters.map(filter =>
      filter.id === id ? { ...filter, [field]: value } : filter
    );
    setFilters(updatedFilters);
    onChange(updatedFilters);
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.value === category);
    return categoryData ? React.createElement(categoryData.icon, { className: "h-4 w-4" }) : null;
  };

  return (
    <div className="bg-white p-4 border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Sub-Segment Filters</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    {React.createElement(category.icon, { className: "h-4 w-4" })}
                    {category.label}
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
          <p>No filters applied. Select a category and click "Add Filter" to create a sub-segment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter) => (
            <div key={filter.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getCategoryIcon(filter.category)}
                <span className="capitalize">{filter.category}</span>
              </div>
              
              <Select
                value={filter.field}
                onValueChange={(value) => updateFilter(filter.id, 'field', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getFieldsForCategory(filter.category).map((field) => (
                    <SelectItem key={field.name} value={field.name}>
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

              <Input
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                placeholder="Enter value..."
                className="flex-1"
              />

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
            {filters.map((filter) => {
              const fieldData = allFields.find(f => f.name === filter.field);
              const categoryData = categories.find(c => c.value === filter.category);
              return (
                <div key={filter.id} className="flex items-center gap-2">
                  <span className="capitalize">{categoryData?.label}:</span>
                  <span>{fieldData?.label}</span>
                  <span>{filter.operator}</span>
                  <span className="font-medium">"{filter.value}"</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 