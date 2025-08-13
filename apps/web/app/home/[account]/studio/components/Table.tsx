'use client';

import React, { useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
} from '@tanstack/react-table';
import { parseCSV } from '../utils/parseCSV';
import { CustomColumn } from '../utils/fieldOptions';
import { validateEmail, validateURL, enrichCompany, getJobSeniority } from '../utils/triggerFieldAPI';
import { X, Code } from 'lucide-react';

interface DataRow {
  domain: string;
  enrich_company: string;
  url: string;
  company_name?: string;
  company_domain?: string;
  industry?: string;
  job_title?: string;
  seniority?: string;
  department?: string;
  employee_count?: string;
  company_revenue?: string;
  city?: string;
  state?: string;
  zip?: string;
  age?: number;
  gender?: string;
  income_range?: string;
  education?: string;
  homeowner?: string;
  married?: string;
  [key: string]: any; // Allow dynamic custom fields
}

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface TableProps {
  filters: Filter[];
  previewData?: any[];
  loading?: boolean;
  customColumns?: CustomColumn[];
  hiddenFields?: Set<string>;
  onAddField?: (field: CustomColumn) => void;
  onDeleteField?: (fieldToDelete: string) => void;
}

export default function Table({ filters, previewData, loading, customColumns = [], hiddenFields = new Set(), onDeleteField }: TableProps) {
  const [rowData, setRowData] = useState<DataRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [runningCodeTransforms, setRunningCodeTransforms] = useState(false);
  const [dynamicColumns, setDynamicColumns] = useState<ColumnDef<DataRow>[]>([]);

  const runEnrichment = async () => {
    if (customColumns.length === 0) return;
    
    setEnriching(true);
    try {
      const updatedData = await Promise.all(
        rowData.map(async (row) => {
          const enrichedRow = { ...row };
          
          for (const col of customColumns) {
            switch (col.type) {
              case 'email':
                if (row.email) {
                  enrichedRow[col.field] = await validateEmail(row.email);
                }
                break;
              case 'url':
                if (row.url) {
                  enrichedRow[col.field] = await validateURL(row.url);
                }
                break;
              case 'text':
                if (row.domain) {
                  enrichedRow[col.field] = await enrichCompany(row.domain);
                }
                break;
              case 'select':
                if (row.job_title) {
                  enrichedRow[col.field] = await getJobSeniority(row.job_title);
                }
                break;
              default:
                enrichedRow[col.field] = 'N/A';
            }
          }
          
          return enrichedRow;
        })
      );
      
      setRowData(updatedData);
    } catch (error) {
      console.error('Enrichment error:', error);
    } finally {
      setEnriching(false);
    }
  };

  const runCodeTransforms = async () => {
    const codeColumns = customColumns.filter(col => col.type === 'code' && col.transform);
    if (codeColumns.length === 0) return;
    
    setRunningCodeTransforms(true);
    try {
      const updatedData = await Promise.all(
        rowData.map(async (row, rowIndex) => {
          const updatedRow = { ...row };
          const errors: string[] = [];
          
          for (const col of codeColumns) {
            if (col.transform && col.sourceField) {
              try {
                const sourceValue = row[col.sourceField] || '';
                const transformFn = new Function('input', col.transform);
                const transformedValue = transformFn(sourceValue);
                updatedRow[col.field] = transformedValue;
              } catch (error) {
                updatedRow[col.field] = 'ERR';
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${col.headerName}: ${errorMessage}`);
              }
            }
          }
          
          // Log errors for debugging (only first few rows to avoid spam)
          if (errors.length > 0 && rowIndex < 5) {
            console.warn(`Row ${rowIndex + 1} transform errors:`, errors);
          }
          
          return updatedRow;
        })
      );
      
      setRowData(updatedData);
      
      // Show success message
      const totalErrors = updatedData.reduce((count, row) => {
        return count + Object.values(row).filter(val => val === 'ERR').length;
      }, 0);
      
      if (totalErrors > 0) {
        console.warn(`Transform completed with ${totalErrors} errors`);
      } else {
        console.log('All transforms completed successfully');
      }
    } catch (error) {
      console.error('Code transform error:', error);
    } finally {
      setRunningCodeTransforms(false);
    }
  };

  const baseColumns: ColumnDef<DataRow>[] = [
    // Business Fields
    {
      accessorKey: 'domain',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Domain</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('domain')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Domain"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_name',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company Name</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_name')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company Name"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_domain',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company Domain</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_domain')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company Domain"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'industry',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Industry</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('industry')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Industry"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'job_title',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Job Title</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('job_title')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Job Title"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'seniority',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Seniority</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('seniority')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Seniority"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Department</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('department')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Department"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'employee_count',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Employee Count</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('employee_count')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Employee Count"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_revenue',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company Revenue</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_revenue')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company Revenue"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_address',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company Address</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_address')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company Address"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_phone',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company Phone</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_phone')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company Phone"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_linkedin_url',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company LinkedIn URL</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_linkedin_url')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company LinkedIn URL"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_description',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company Description</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_description')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company Description"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'sic',
      header: () => (
        <div className="flex items-center justify-between">
          <span>SIC Code</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('sic')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete SIC Code"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_naics',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company NAICS</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_naics')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company NAICS"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_name_history',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company Name History</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_name_history')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company Name History"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'job_title_history',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Job Title History</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('job_title_history')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Job Title History"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'social_connections',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Social Connections</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('social_connections')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Social Connections"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_city',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company City</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_city')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company City"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_state',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company State</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_state')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company State"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_zip',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company Zip</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_zip')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company Zip"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'headline',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Professional Headline</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('headline')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Professional Headline"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'years_experience',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Years of Experience</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('years_experience')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Years of Experience"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'linkedin_url',
      header: () => (
        <div className="flex items-center justify-between">
          <span>LinkedIn URL</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('linkedin_url')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete LinkedIn URL"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        if (!value) return <span>-</span>;
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {value}
          </a>
        );
      },
    },
    {
      accessorKey: 'twitter_url',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Twitter URL</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('twitter_url')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Twitter URL"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        if (!value) return <span>-</span>;
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {value}
          </a>
        );
      },
    },
    {
      accessorKey: 'facebook_url',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Facebook URL</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('facebook_url')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Facebook URL"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        if (!value) return <span>-</span>;
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {value}
          </a>
        );
      },
    },
    {
      accessorKey: 'skills',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Skills</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('skills')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Skills"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'interests',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Interests</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('interests')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Interests"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    // Personal Fields
    {
      accessorKey: 'first_name',
      header: () => (
        <div className="flex items-center justify-between">
          <span>First Name</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('first_name')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete First Name"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'last_name',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Last Name</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('last_name')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Last Name"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'business_email',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Business Email</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('business_email')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Business Email"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        if (!value) return <span>-</span>;
        return (
          <a 
            href={`mailto:${value}`}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {value}
          </a>
        );
      },
    },
    {
      accessorKey: 'personal_email',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal Email</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_email')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal Email"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        if (!value) return <span>-</span>;
        return (
          <a 
            href={`mailto:${value}`}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {value}
          </a>
        );
      },
    },
    {
      accessorKey: 'age',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Age</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('age')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Age"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'age_range',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Age Range</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('age_range')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Age Range"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'gender',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Gender</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('gender')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Gender"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'children',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Children</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('children')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Children"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'education',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Education</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('education')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Education"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'education_history',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Education History</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('education_history')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Education History"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    // Financial Fields
    {
      accessorKey: 'income_range',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Income Range</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('income_range')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Income Range"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'net_worth',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Net Worth</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('net_worth')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Net Worth"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'credit_rating',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Credit Rating</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('credit_rating')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Credit Rating"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'credit_range_new_credit',
      header: () => (
        <div className="flex items-center justify-between">
          <span>New Credit Range</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('credit_range_new_credit')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete New Credit Range"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'credit_card_user',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Credit Card User</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('credit_card_user')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Credit Card User"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'investment',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Investment</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('investment')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Investment"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'mortgage_amount',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Mortgage Amount</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('mortgage_amount')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Mortgage Amount"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'occupation_group',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Occupation Group</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('occupation_group')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Occupation Group"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'occupation_type',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Occupation Type</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('occupation_type')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Occupation Type"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'cra_code',
      header: () => (
        <div className="flex items-center justify-between">
          <span>CRA Code</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('cra_code')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete CRA Code"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'skiptrace_credit_rating',
      header: () => (
        <div className="flex items-center justify-between">
          <span>SkipTrace Credit Rating</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('skiptrace_credit_rating')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete SkipTrace Credit Rating"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    // Family Fields
    {
      accessorKey: 'homeowner',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Homeowner</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('homeowner')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Homeowner"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'married',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Married</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('married')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Married"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'ethnic_code',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Ethnicity</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('ethnic_code')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Ethnicity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'language_code',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Language</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('language_code')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Language"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'smoker',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Smoker</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('smoker')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Smoker"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_children',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal Children</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_children')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal Children"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_headline',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal Headline</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_headline')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal Headline"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'inferred_years_experience',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Inferred Years Experience</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('inferred_years_experience')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Inferred Years Experience"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'family_children',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Family Children</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('family_children')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Family Children"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'single_parent',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Single Parent</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('single_parent')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Single Parent"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'marital_status',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Marital Status</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('marital_status')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Marital Status"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'generations_in_household',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Generations in Household</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('generations_in_household')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Generations in Household"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    // Location Fields
    {
      accessorKey: 'city',
      header: () => (
        <div className="flex items-center justify-between">
          <span>City</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('city')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete City"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'state',
      header: () => (
        <div className="flex items-center justify-between">
          <span>State</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('state')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete State"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'zip',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Zip Code</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('zip')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Zip Code"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_address',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal Address</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_address')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal Address"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_city',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal City</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_city')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal City"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_state',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal State</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_state')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal State"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_zip',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal Zip</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_zip')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal Zip"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    // Housing Fields
    {
      accessorKey: 'home_year_built',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Home Year Built</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('home_year_built')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Home Year Built"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'home_value',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Home Value</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('home_value')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Home Value"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'home_square_footage',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Home Square Footage</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('home_square_footage')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Home Square Footage"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'home_ownership_type',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Home Ownership Type</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('home_ownership_type')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Home Ownership Type"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    // Contact Fields
    {
      accessorKey: 'uuid',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Contact UUID</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('uuid')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Contact UUID"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'mobile_phone',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Mobile Phone</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('mobile_phone')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Mobile Phone"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'direct_number',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Direct Phone</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('direct_number')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Direct Phone"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_phone',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal Phone</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_phone')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal Phone"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'deep_verified_emails',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Deep Verified Emails</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('deep_verified_emails')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Deep Verified Emails"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    // SkipTrace Fields
    {
      accessorKey: 'skiptrace_match_score',
      header: () => (
        <div className="flex items-center justify-between">
          <span>SkipTrace Match Score</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('skiptrace_match_score')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete SkipTrace Match Score"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'skiptrace_exact_age',
      header: () => (
        <div className="flex items-center justify-between">
          <span>SkipTrace Exact Age</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('skiptrace_exact_age')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete SkipTrace Exact Age"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    // Contact Fields
    {
      accessorKey: 'uuid',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Contact UUID</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('uuid')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Contact UUID"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'direct_number',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Direct Phone</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('direct_number')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Direct Phone"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'direct_number_dnc',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Direct Phone DNC</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('direct_number_dnc')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Direct Phone DNC"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'mobile_phone',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Mobile Phone</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('mobile_phone')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Mobile Phone"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'mobile_phone_dnc',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Mobile Phone DNC</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('mobile_phone_dnc')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Mobile Phone DNC"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_phone',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal Phone</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_phone')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal Phone"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_phone_dnc',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal Phone DNC</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_phone_dnc')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal Phone DNC"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_emails',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Personal Emails</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('personal_emails')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Personal Emails"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'deep_verified_emails',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Deep Verified Emails</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('deep_verified_emails')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Deep Verified Emails"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'sha256_personal_email',
      header: () => (
        <div className="flex items-center justify-between">
          <span>SHA256 Personal Email</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('sha256_personal_email')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete SHA256 Personal Email"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'sha256_business_email',
      header: () => (
        <div className="flex items-center justify-between">
          <span>SHA256 Business Email</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('sha256_business_email')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete SHA256 Business Email"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'valid_phones',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Valid Phones</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('valid_phones')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Valid Phones"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'skiptrace_landline_numbers',
      header: () => (
        <div className="flex items-center justify-between">
          <span>SkipTrace Landline Numbers</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('skiptrace_landline_numbers')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete SkipTrace Landline Numbers"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'skiptrace_wireless_numbers',
      header: () => (
        <div className="flex items-center justify-between">
          <span>SkipTrace Wireless Numbers</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('skiptrace_wireless_numbers')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete SkipTrace Wireless Numbers"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'skiptrace_b2b_phone',
      header: () => (
        <div className="flex items-center justify-between">
          <span>SkipTrace B2B Phone</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('skiptrace_b2b_phone')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete SkipTrace B2B Phone"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    // Legacy fields for backward compatibility
    {
      accessorKey: 'enrich_company',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company (Legacy)</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('enrich_company')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company (Legacy)"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'url',
      header: () => (
        <div className="flex items-center justify-between">
          <span>URL (Legacy)</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('url')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete URL (Legacy)"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        if (!value) return <span>-</span>;
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {value}
          </a>
        );
      },
    },
  ];

  // Get base column field names to avoid duplicates in custom columns
  const baseColumnFields = new Set(
    baseColumns
      .map(col => 'accessorKey' in col ? col.accessorKey as string : null)
      .filter(Boolean)
  );

  // Convert custom columns to table columns, filtering out duplicates
  const customTableColumns: ColumnDef<DataRow>[] = customColumns
    .filter(col => {
      // Allow enriched fields to override base columns if they contain data
      const hasData = rowData.some(row => row[col.field] && row[col.field] !== '');
      const isBaseColumn = baseColumnFields.has(col.field);
      
      if (isBaseColumn && hasData) {
        console.log(`Allowing enriched field "${col.field}" to override base column (has data: ${hasData})`);
        return true;
      } else if (isBaseColumn && !hasData) {
        console.log(`Filtering out custom column "${col.field}" as it conflicts with base column and has no data`);
        return false;
      } else {
        console.log(`Including custom column "${col.field}" (not in base columns)`);
        return true;
      }
    })
    .map(col => ({
    accessorKey: col.field,
    header: () => (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span>{col.headerName}</span>
          {col.type === 'code' && (
            <Code className="h-3 w-3 text-blue-500" />
          )}
        </div>
        {onDeleteField && (
          <button
            onClick={() => onDeleteField(col.field)}
            className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title={`Delete ${col.headerName}`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    ),
    cell: ({ getValue, row }) => {
      const value = getValue();
      
      if (col.type === 'checkbox') {
        return (
          <input 
            type="checkbox" 
            checked={!!value} 
            readOnly 
            className="h-4 w-4 text-blue-600"
          />
        );
      }
      
      if (col.type === 'code' && col.transform && col.sourceField) {
        try {
          const sourceValue = row.original[col.sourceField] || '';
          const transformFn = new Function('input', col.transform);
          const transformedValue = transformFn(sourceValue);
          return (
            <div className="flex flex-col">
              <span className="text-blue-600 font-mono text-sm">{String(transformedValue || '')}</span>
              <span className="text-xs text-gray-400">from {col.sourceField}</span>
            </div>
          );
        } catch (error) {
          return (
            <div className="flex flex-col">
              <span className="text-red-500 text-xs">ERR</span>
              <span className="text-xs text-gray-400">from {col.sourceField}</span>
            </div>
          );
        }
      }
      
      return <span>{String(value || '')}</span>;
    },
  }));

  // Filter out hidden fields from base columns
  const visibleBaseColumns = baseColumns.filter(col => {
    if (!('accessorKey' in col)) return true;
    
    const fieldName = col.accessorKey as string;
    const isHidden = hiddenFields.has(fieldName);
    
    // Check if this field has enriched data and should be overridden
    const hasEnrichedData = rowData.some(row => row[fieldName] && row[fieldName] !== '');
    const isEnrichedField = customColumns.some(customCol => customCol.field === fieldName);
    
    if (isHidden) {
      console.log(`Hiding base column "${fieldName}" (in hiddenFields)`);
      return false;
    }
    
    if (isEnrichedField && hasEnrichedData) {
      console.log(`Hiding base column "${fieldName}" (will be overridden by enriched column)`);
      return false;
    }
    
    return true;
  });

  // Combine base, dynamic, and custom columns, ensuring unique accessorKeys
  const allColumns = [...visibleBaseColumns, ...dynamicColumns, ...customTableColumns];
  
  // Ensure unique accessorKeys by keeping the first occurrence of each key
  const seenKeys = new Set<string>();
  const columns = allColumns.filter(col => {
    if ('accessorKey' in col) {
      const key = col.accessorKey as string;
      if (seenKeys.has(key)) {
        console.warn(`Duplicate column key detected and filtered: ${key}`);
        return false;
      }
      seenKeys.add(key);
    }
    return true;
  });

  // Debug logging for column conflicts (remove in production)
  if (process.env.NODE_ENV === 'development') {
    const columnKeys = columns.map(col => 'accessorKey' in col ? col.accessorKey : 'no-key');
    const duplicates = columnKeys.filter((key, index) => columnKeys.indexOf(key) !== index);
    if (duplicates.length > 0) {
      console.warn('Duplicate column keys detected:', duplicates);
    }
  }



  // Load initial CSV data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await parseCSV('/sample.csv');
        setRowData(data);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, []);

  // Generate dynamic columns for webhook data and pixel data
  useEffect(() => {
    if (previewData && previewData.length > 0) {
      // Check if this looks like webhook data (has _webhook_id field)
      const isWebhookData = previewData.some(row => row._webhook_id);
      
      // Check if this looks like pixel data (has resolution fields)
      const isPixelData = previewData.some(row => Object.keys(row).some(key => key.startsWith('resolution.')));
      
      if (isWebhookData || isPixelData) {
        // Get all unique field names from the data
        const allFields = new Set<string>();
        previewData.forEach(row => {
          Object.keys(row).forEach(key => {
            if (!key.startsWith('_webhook_')) { // Exclude webhook metadata
              allFields.add(key);
            }
          });
        });

        // Filter out fields that already exist in base columns
        const uniqueFields = Array.from(allFields).filter(field => !baseColumnFields.has(field));

        // Create dynamic columns for the fields
        const dynamicColumns: ColumnDef<DataRow>[] = uniqueFields.map(field => ({
          accessorKey: field,
          header: () => (
            <div className="flex items-center justify-between">
              <span>{field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ').replace(/\./g, ' ')}</span>
              {onDeleteField && (
                <button
                  onClick={() => onDeleteField(field)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title={`Delete ${field}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ),
          cell: ({ getValue }: any) => {
            const value = getValue();
            return value ? String(value) : '';
          }
        }));

        setDynamicColumns(dynamicColumns);
        console.log(`Generated ${dynamicColumns.length} dynamic columns for ${isWebhookData ? 'webhook' : 'pixel'} data`);
      } else {
        setDynamicColumns([]);
      }
    } else {
      setDynamicColumns([]);
    }
  }, [previewData, onDeleteField]);

  // Update data when preview data is available
  useEffect(() => {
    if (previewData && previewData.length > 0) {
      setRowData(previewData);
    }
  }, [previewData]);

  // Update row data when custom columns are added or removed
  useEffect(() => {
    setRowData(prevData => 
      prevData.map(row => {
        const updatedRow = { ...row };
        
        // Add new custom fields with empty values
        customColumns.forEach(col => {
          if (!(col.field in updatedRow)) {
            updatedRow[col.field] = '';
          }
        });
        
        // Remove deleted custom fields
        const customFieldNames = customColumns.map(col => col.field);
        Object.keys(updatedRow).forEach(key => {
          if (key.startsWith('custom_') && !customFieldNames.includes(key)) {
            delete updatedRow[key];
          }
        });
        
        return updatedRow;
      })
    );
  }, [customColumns]);

  const table = useReactTable({
    data: rowData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Preview Status */}
      {previewData && previewData.length > 0 && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">
                Preview Mode - {previewData.length} filtered results
              </span>
            </div>
            <span className="text-xs text-blue-600">
              Showing filtered data from Google Cloud Storage
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <span className="text-sm text-yellow-800">
              Loading preview data...
            </span>
          </div>
        </div>
      )}

      {/* Field Management Status */}
      {(customColumns.length > 0 || hiddenFields.size > 0) && (
        <div className="p-4 bg-green-50 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  Fields: {customColumns.filter(col => col.type !== 'code').length} custom, {customColumns.filter(col => col.type === 'code').length} code, {hiddenFields.size} hidden
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-700">
                <span>•</span>
                <span>Click the X icon in column headers to delete fields</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {customColumns.filter(col => col.type === 'code' && col.transform).length > 0 && (
                <button
                  onClick={runCodeTransforms}
                  disabled={runningCodeTransforms}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {runningCodeTransforms ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Running Transforms...
                    </>
                  ) : (
                    <>
                      <Code className="h-4 w-4" />
                      Run Code Transforms
                    </>
                  )}
                </button>
              )}
              {customColumns.filter(col => col.type !== 'code').length > 0 && (
                <button
                  onClick={runEnrichment}
                  disabled={enriching}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {enriching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Running Enrichment...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      Run Enrichment
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>
              {' '}of{' '}
              <span className="font-medium">{table.getFilteredRowModel().rows.length}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
} 